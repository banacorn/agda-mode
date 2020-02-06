open! Rebase;

open Instance__Type;
open Atom;

let inquireAgdaPath =
    (error: option(Connection2.Error.t), instance)
    : Promise.t(result(string, MiniEditor.error)) => {
  open View;
  instance.view.activate();
  instance.view.navigateSettings(Settings.URI.Connection)
  ->Promise.flatMap(_ => {
      instance.view.updateConnection(None, error);
      instance.view.inquireConnection();
    });
};

let getAgdaPath = (instance): Promise.t(result(string, MiniEditor.error)) => {
  let storedPath = Config.get("agda-mode.agdaPath") |> Parser.filepath;
  let searchingFor = Config.get("agda-mode.agdaName") |> String.trim;
  let searchedPath =
    if (String.isEmpty(storedPath) || storedPath == ".") {
      Connection.autoSearch(searchingFor);
    } else {
      Promise.resolved(Ok(storedPath));
    };

  searchedPath->Promise.flatMapError(err => {
    instance.onConnectionError.emit(err);
    instance |> inquireAgdaPath(Some(err));
  });
};

let persistConnection = (instance, connection: Connection.t) => {
  instance.connection = Some(connection);
  /* store the path in the config */
  let path =
    Array.concat(connection.metadata.args, [|connection.metadata.path|])
    |> List.fromArray
    |> String.joinWith(" ");
  Config.set("agda-mode.agdaPath", path) |> ignore;
  /* update the view */
  instance.view.updateConnection(Some(connection), None);
  /* pass it on */
  connection;
};
let connectWithAgdaPath =
    (instance, path): Promise.t(result(Connection.t, MiniEditor.error)) => {
  /* validate the given path */
  let rec getMetadata =
          (instance, pathAndParams)
          : Promise.t(result(Metadata.t, MiniEditor.error)) => {
    Connection.validateAndMake(pathAndParams)
    ->Promise.flatMapError(err =>
        inquireAgdaPath(Some(err), instance)
        ->Promise.flatMapOk(getMetadata(instance))
      );
  };

  // handle unbound errors
  // let handleUnboundErrors = (instance, connection): Connection.t => {
  //   connection.Connection.errorEmitter.on(res =>
  //     instance.handleResponse(instance, res) |> ignore
  //   )
  //   |> ignore;
  //   connection;
  // };
  instance
  ->getMetadata(path)
  ->Promise.mapOk(Connection.connect)
  ->Promise.mapOk(persistConnection(instance))
  // ->Promise.mapOk(handleUnboundErrors(instance))
  ->Promise.mapOk(Connection.wire);
};

// would stuck (and wait for the user) if the path is wrong, not suitable for testing
let connect = (instance): Promise.t(result(Connection.t, MiniEditor.error)) => {
  switch (instance.connection) {
  | Some(connection) => Promise.resolved(Ok(connection))
  | None =>
    instance->getAgdaPath->Promise.flatMapOk(connectWithAgdaPath(instance))
  };
};

let disconnect = instance => {
  switch (instance.connection) {
  | Some(connection) =>
    Connection.disconnect(
      Connection2.Process.Error.DisconnectedByUser,
      connection,
    );
    instance.connection = None;
    instance.view.updateConnection(None, None);
  | None => Promise.resolved()
  };
};

let get = connect;

let set = persistConnection;