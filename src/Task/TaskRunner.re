open Task;

open! Rebase;

// Request.t => Request.packed
let packRequest = (request, instance) => {
  Instance__Connections.get(instance)
  ->Promise.flatMapOk((connection: Connection.t) =>
      instance.view.display(
        "Loading ...",
        Type.View.Header.PlainText,
        Emacs(PlainText("")),
      )
      ->Promise.map(() =>
          Ok(
            {
              version: connection.metadata.version,
              filepath: instance |> Instance__TextEditors.getPath,
              request,
            }: Request.packed,
          )
        )
    )
  ->Promise.mapError(_ => Instance__Type.Cancelled);
};

// run the Tasks
let rec run =
        (
          instance: Instance.t,
          errorHandler: Instance__Type.error => Promise.t(unit),
          tasks: list(t),
        )
        : Promise.t(unit) => {
  let runTask = task =>
    switch (task) {
    | WithInstance(callback) =>
      callback(instance)
      ->Promise.flatMap(
          fun
          | Ok(tasks) => run(instance, errorHandler, tasks)
          | Error(error) => errorHandler(error),
        )
    | DispatchCommand(command) =>
      Instance__TextEditors.startCheckpoint(command, instance);
      let program =
        command |> Task__Command.handle |> run(instance, errorHandler);
      program->Promise.tap(() =>
        Instance__TextEditors.endCheckpoint(instance)
      );
    | SendRequest(request) =>
      packRequest(request, instance)
      ->Promise.flatMap(x =>
          instance.view.updateIsPending(true)->Promise.map(() => x)
        )
      ->Promise.flatMapOk(x =>
          Instance__Handler.handleRequest(
            instance,
            Instance__Handler.handleResponse,
            Some(x),
          )
        )
      ->Promise.flatMap(x =>
          instance.view.updateIsPending(false)->Promise.map(() => x)
        )
      ->Promise.mapOk(_ => instance.onDispatch.emit(Ok()))
      ->Promise.tapError(error => instance.onDispatch.emit(Error(error)))
      ->Instance__Handler.handleCommandError(instance)
      ->Promise.map(_ => ())
    };

  let rec runEach =
    fun
    | [] => Promise.resolved()
    | [x, ...xs] => {
        runTask(x)->Promise.flatMap(() => runEach(xs));
      };
  runEach(tasks);
};
