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
  let runTasks = x =>
    Promise.flatMap(
      x,
      fun
      | Ok(tasks) => run(instance, errorHandler, tasks)
      | Error(error) => errorHandler(error),
    );
  let runTask = task =>
    switch (task) {
    | WithInstance(callback) => callback(instance)->runTasks
    | Disconnect => Instance__Connections.disconnect(instance)
    | Activate => instance.view.activate()->Promise.map(_ => ())
    | Deactivate => instance.view.deactivate()
    | Display(header, style, body) =>
      instance.view.display(header, style, body)
    | Inquire(header, placeholder, value, callback) =>
      instance.view.inquire(header, placeholder, value)
      ->Promise.mapError(_ => Instance__Type.Cancelled)
      ->Promise.mapOk(callback)
      ->runTasks
    | Editor(Save) =>
      instance.editors.source
      ->Atom.TextEditor.save
      ->Promise.Js.fromBsPromise
      ->Promise.Js.toResult
      ->Promise.mapError(_ => Instance__Type.Cancelled)
      ->Promise.mapOk(_ => [])
      ->runTasks
    | Goals(GetPointed(callback)) =>
      Instance__TextEditors.getPointedGoal(instance)
      ->Promise.flatMapOk(Instance__TextEditors.getGoalIndex)
      ->Promise.mapOk(callback)
      ->runTasks
    | Goals(GetPointedOr(callback, handler)) =>
      Instance__TextEditors.getPointedGoal(instance)
      ->Promise.flatMapOk(Instance__TextEditors.getGoalIndex)
      ->Promise.mapOk(callback)
      ->Promise.flatMap(
          fun
          | Ok(tasks) => run(instance, errorHandler, tasks)
          | Error(OutOfGoal) => handler() |> run(instance, errorHandler)
          | Error(error) => errorHandler(error),
        )
    | Goals(JumpToTheNext) =>
      Instance__Goals.getNextGoalPosition(instance)
      |> Option.forEach(position =>
           instance.editors.source
           |> Atom.TextEditor.setCursorBufferPosition(position)
         )
      |> Promise.resolved
    | Goals(JumpToThePrevious) =>
      Instance__Goals.getPreviousGoalPosition(instance)
      |> Option.forEach(position =>
           instance.editors.source
           |> Atom.TextEditor.setCursorBufferPosition(position)
         )
      |> Promise.resolved
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

let dispatchCommand = (command, instance) =>
  Task__Command.handle(Command.parse(command))
  |> run(instance, error =>
       Instance__Handler.handleCommandError(
         Promise.resolved(Error(error)),
         instance,
       )
       ->Promise.map(_ => ())
     )
  |> ignore;
