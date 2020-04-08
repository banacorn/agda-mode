open! Rebase;

open Instance__Type;
open Atom;

// inquire Agda path from the user
let inquireAgdaPath =
    (error: option(Connection.Error.t), instance)
    : Promise.t(result(string, error)) => {
  View.(
    instance.view.activate()
    ->Promise.flatMap(() =>
        instance.view.navigateSettings(Settings.URI.Connection)
      )
    ->Promise.flatMap(() => instance.view.updateConnection(None, error))
    ->Promise.flatMap(() => instance.view.inquireConnection())
    ->Promise.mapError(_ => Instance__Type.Cancelled)
  );
};

// get Agda path from config or from the user
let getAgdaPathAndArgs =
    (instance): Promise.t(result((string, array(string)), error)) => {
  let storedPath = Config.get("agda-mode.agdaPath") |> Parser.filepath;
  let storedArgs = Config.get("agda-mode.agdaArgs") |> Parser.commandLineArgs;
  if (String.isEmpty(storedPath) || storedPath == ".") {
    let searchingFor = Config.get("agda-mode.agdaName") |> String.trim;
    Connection.autoSearch(searchingFor)
    ->Promise.flatMapError(err => {
        // log connection error for testing
        instance.onConnectionError.emit(err);
        inquireAgdaPath(Some(err), instance);
      })
    ->Promise.mapOk(path => (path, [||]));
  } else {
    Promise.resolved(Ok((storedPath, storedArgs)));
  };
};

let persistConnection =
    (instance, connection: Connection.t)
    : Promise.t(result(Connection.t, error)) => {
  instance.connection = Some(connection);
  /* store the path in the config */
  let path =
    Array.concat(connection.metadata.args, [|connection.metadata.path|])
    |> List.fromArray
    |> String.joinWith(" ");
  Config.set("agda-mode.agdaPath", path) |> ignore;
  // update the view, and then pass the connection out
  instance.view.updateConnection(Some(connection), None)
  ->Promise.map(() => Ok(connection));
};

let connectWithAgdaPathAndArgs =
    (instance, path, args): Promise.t(result(Connection.t, error)) => {
  // validate the given path
  let rec getMetadata = (instance, path, args) => {
    Connection.validateAndMake(path, args)
    ->Promise.flatMapError(err =>
        inquireAgdaPath(Some(err), instance)
        ->Promise.flatMapOk(p => getMetadata(instance, p, args))
      );
  };

  instance
  ->getMetadata(path, args)
  ->Promise.mapOk(Connection.connect)
  ->Promise.flatMapOk(persistConnection(instance))
  ->Promise.mapOk(Connection.wire);
};

// would stuck (and wait for the user) if the path is wrong, not suitable for testing
let connect = (instance): Promise.t(result(Connection.t, error)) => {
  switch (instance.connection) {
  | Some(connection) => Promise.resolved(Ok(connection))
  | None =>
    instance
    ->getAgdaPathAndArgs
    ->Promise.flatMapOk(((path, args)) =>
        connectWithAgdaPathAndArgs(instance, path, args)
      )
  };
};

let disconnect = instance => {
  switch (instance.connection) {
  | Some(connection) =>
    Connection.disconnect(Process.Error.DisconnectedByUser, connection);
    instance.connection = None;
    instance.view.updateConnection(None, None);
  | None => Promise.resolved()
  };
};