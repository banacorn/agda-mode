open Rebase;
open Async;

open Instance__Type;
open Atom;

let inquireAgdaPath =
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
         instance.view |> inquireConnection;
         instance.view |> updateConnection(None, error);
         promise;
       });
  instance.view |> activateSettingsView;

  promise;
};

let getAgdaPath = (instance): Async.t(string, MiniEditor.error) => {
  let storedPath =
    Environment.Config.get("agda-mode.agdaPath") |> Parser.filepath;
  let searchedPath =
    if (storedPath |> String.isEmpty) {
      Connection.autoSearch("agda");
    } else {
      resolve(storedPath);
    };

  searchedPath
  |> thenError(err =>
       instance |> inquireAgdaPath(Some(Connection.AutoSearchError(err)))
     );
};

let connectWithAgdaPath =
    (instance, path): Async.t(Connection.t, MiniEditor.error) => {
  /* validate the given path */
  let rec getMetadata =
          (instance, pathAndParams)
          : Async.t(Connection.metadata, MiniEditor.error) => {
    Connection.validateAndMake(pathAndParams)
    |> thenError(err =>
         instance
         |> inquireAgdaPath(
              Some(Connection.ValidationError(pathAndParams, err)),
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
    instance.view |> View.Handles.updateConnection(Some(connection), None);
    /* pass it on */
    connection;
  };

  let rec getConnection =
          (instance, metadata): Async.t(Connection.t, MiniEditor.error) => {
    Connection.connect(metadata)
    |> thenError(err =>
         instance
         |> inquireAgdaPath(Some(Connection.ConnectionError(err)))
         |> thenOk(getMetadata(instance))
         |> thenOk(getConnection(instance))
       );
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

  path
  |> getMetadata(instance)
  |> thenOk(getConnection(instance))
  |> mapOk(persistConnection(instance))
  |> mapOk(handleUnboundError(instance))
  |> mapOk(Connection.wire);
};

let connect = (instance): Async.t(Connection.t, MiniEditor.error) => {
  switch (instance.connection) {
  | Some(connection) => resolve(connection)
  | None => instance |> getAgdaPath |> thenOk(connectWithAgdaPath(instance))
  };
};

let disconnect = instance => {
  switch (instance.connection) {
  | Some(connection) =>
    Connection.disconnect(Connection.DisconnectedByUser, connection);
    instance.connection = None;
    instance.view |> View.Handles.updateConnection(None, None);
  | None => ()
  };
};

let get = instance => {
  switch (instance.connection) {
  | Some(connection) => resolve(connection)
  | None => connect(instance)
  };
};
