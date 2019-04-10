open Rebase;
open Async;

open Instance__Type;
open Atom;
let connect = (instance): Async.t(Connection.t, MiniEditor.error) => {
  let inquireConnection =
      (error: option(Connection.error), instance)
      : Async.t(string, MiniEditor.error) => {
    open View.Handles;
    activate(instance.view);
    /* listen to `onSettingsView` before triggering `activateSettingsView` */
    let promise: Async.t(string, MiniEditor.error) =
      instance.view
      |> onOpenSettingsView
      |> thenOk(_ => {
           instance.view |> navigateSettingsView(Settings.URI.Connection);
           /* listen to `onInquireConnection` before triggering `inquireConnection` */
           let promise = instance.view |> onInquireConnection;
           instance.view |> inquireConnection(error, "");
           promise;
         });
    instance.view |> activateSettingsView;

    promise;
  };
  let getAgdaPath = (): Async.t(string, Connection.autoSearchError) => {
    let storedPath =
      Environment.Config.get("agda-mode.agdaPath") |> Parser.filepath;
    if (storedPath |> String.isEmpty) {
      Connection.autoSearch("agda");
    } else {
      resolve(storedPath);
    };
  };

  /* validate the given path */
  let rec getMetadata =
          (instance, pathAndParams)
          : Async.t(Connection.metadata, MiniEditor.error) => {
    let (path, args) = Parser.commandLine(pathAndParams);
    Connection.validateAndMake(path, args)
    |> thenError(err =>
         instance
         |> inquireConnection(
              Some(Connection.Validation(pathAndParams, err)),
            )
         |> thenOk(getMetadata(instance))
       );
  };

  let persistConnection = (instance, connection: Connection.t) => {
    instance.connection = Some(connection);
    /* store the path in the config */
    let path =
      Array.concat(connection.metadata.args, [|connection.metadata.path|])
      |> List.fromArray
      |> String.joinWith(" ");
    Environment.Config.set("agda-mode.agdaPath", path);
    /* update the view */
    instance.view.updateConnection |> Event.emitOk(Some(connection));
    /* pass it on */
    connection;
  };

  let rec getConnection =
          (instance, metadata): Async.t(Connection.t, MiniEditor.error) => {
    Connection.connect(metadata)
    |> thenError(err => {
         Js.log(err);
         instance
         |> inquireConnection(Some(Connection.Connection(err)))
         |> thenOk(getMetadata(instance))
         |> thenOk(getConnection(instance));
       });
  };
  let handleUnboundError = (instance, connection): Connection.t => {
    Connection.(connection.errorEmitter)
    |> Event.onOk(responses =>
         responses
         |> lift(Response.parse)
         |> mapError(e => Instance__Type.ParseError(e))
         |> thenOk(instance.handleResponses(instance))
         |> ignore
       )
    |> ignore;
    connection;
  };

  switch (instance.connection) {
  | Some(connection) => resolve(connection)
  | None =>
    getAgdaPath()
    |> thenError(err =>
         instance |> inquireConnection(Some(Connection.AutoSearch(err)))
       )
    |> thenOk(getMetadata(instance))
    |> thenOk(getConnection(instance))
    |> mapOk(persistConnection(instance))
    |> mapOk(handleUnboundError(instance))
    |> mapOk(Connection.wire)
  };
};

let disconnect = instance => {
  switch (instance.connection) {
  | Some(connection) =>
    Connection.disconnect(Connection.DisconnectedByUser, connection);
    instance.connection = None;
  | None => ()
  };
};

let get = instance => {
  switch (instance.connection) {
  | Some(connection) => resolve(connection)
  | None => connect(instance)
  };
};
