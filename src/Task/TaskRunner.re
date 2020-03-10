open Task;

open! Rebase;

// Request => Responses
let sendRequest =
    (instance, request: Request.t)
    : Promise.t(result(list(Task.t), Instance__Type.error)) => {
  let (promise, resolve) = Promise.pending();

  Instance__Connections.get(instance)
  ->Promise.tapError(_error => resolve(Error(Instance__Type.Cancelled)))
  ->Promise.getOk(connection => {
      open Request;
      let packedRequest = {
        version: connection.metadata.version,
        filepath: instance |> Instance__TextEditors.getPath,
        request,
      };

      // remove all old log entries if `cmd` is `Load`
      if (Request.isLoad(packedRequest)
          && connection.Connection.resetLogOnLoad) {
        Connection.resetLog(connection);
      };
      // create log entry for each `cmd`
      Log.createEntry(packedRequest.request, connection.log);

      // prepare input for Agda
      let inputForAgda = Request.toAgdaReadableString(packedRequest);

      // store responses from Agda
      let responseTasks = ref([]);
      let parseErrors = ref([]);
      open Parser.Incr.Event;
      let onResponse =
        fun
        | Ok(Yield(Ok(response))) => {
            let tasks = Task__Response.handle(response);
            responseTasks := List.concat(tasks, responseTasks^);
          }
        | Ok(Yield(Error(error))) =>
          parseErrors := [error, ...parseErrors^]
        | Ok(Stop) =>
          if (List.isEmpty(parseErrors^)) {
            resolve(Ok(responseTasks^));
          } else {
            resolve(Error(ParseError(Array.fromList(parseErrors^))));
          }
        | Error(error) =>
          resolve(Error(ConnectionError(Connection.Error.Process(error))));

      let _destructor =
        Connection.send(inputForAgda, connection).on(onResponse);
      ();
    });
  promise;
};

// execute Tasks, but keep DispatchCommand Tasks untouched and return them for later execution
let rec execute =
        (tasks: array(t), instance: Instance__Type.t)
        : Promise.t(array(Command.t)) => {
  let handleCallback = result => {
    let handleError = x => {
      x->Promise.map(
        fun
        | Ok(tasks) => tasks
        | Error(e) => Task__Error.handle(e),
      );
    };

    let filterDispatchCommand = tasks => {
      let otherTasks = [||];
      let commands = [||];

      let rec go =
        fun
        | [] => ()
        | [DispatchCommand(cmd), ...rest] => {
            Js.Array.push(cmd, commands) |> ignore;
            go(rest);
          }
        | [task, ...rest] => {
            Js.Array.push(task, otherTasks) |> ignore;
            go(rest);
          };
      go(tasks);

      (otherTasks, commands);
    };

    let executeTasks = tasks => {
      // filter commands out
      let (otherTasks, commands) = filterDispatchCommand(tasks);
      // execute other tasks
      execute(otherTasks, instance)
      // concat the new commands generated from other tasks
      ->Promise.map(newCommands => Array.concat(newCommands, commands));
    };

    result->handleError->Promise.flatMap(executeTasks);
  };

  let executeTask = task => {
    switch (task) {
    | WithInstance(callback) => callback(instance)->handleCallback
    | WithConnection(callback) =>
      Instance__Connections.get(instance)
      ->Promise.mapError(_ => Instance__Type.Cancelled)
      ->Promise.flatMapOk(callback)
      ->handleCallback
    | Disconnect =>
      Instance__Connections.disconnect(instance)->Promise.map(() => [||])
    | Activate => instance.view.activate()->Promise.map(_ => [||])
    | Deactivate => instance.view.deactivate()->Promise.map(() => [||])
    | Display(header, style, body) =>
      instance.view.display(header, style, body)->Promise.map(() => [||])
    | Inquire(header, placeholder, value, callback) =>
      instance.view.inquire(header, placeholder, value)
      ->Promise.mapError(_ => Instance__Type.Cancelled)
      ->Promise.mapOk(callback)
      ->handleCallback
    | Editor(Save) =>
      instance.editors.source
      ->Atom.TextEditor.save
      ->Promise.Js.fromBsPromise
      ->Promise.Js.toResult
      ->Promise.mapError(_ => Instance__Type.Cancelled)
      ->Promise.mapOk(_ => [])
      ->handleCallback
    | Goals(GetPointed(callback)) =>
      Instance__TextEditors.getPointedGoal(instance)
      ->Promise.mapOk(callback)
      ->handleCallback
    | Goals(GetPointedOr(callback, handler)) =>
      Instance__TextEditors.getPointedGoal(instance)
      ->Promise.mapOk(callback)
      ->Promise.map(
          fun
          | Error(OutOfGoal) => Ok(handler())
          | others => others,
        )
      ->handleCallback
    | Goals(JumpToTheNext) =>
      Instance__Goals.getNextGoalPosition(instance)
      |> Option.forEach(position =>
           instance.editors.source
           |> Atom.TextEditor.setCursorBufferPosition(position)
         );
      Promise.resolved([||]);
    | Goals(JumpToThePrevious) =>
      Instance__Goals.getPreviousGoalPosition(instance)
      |> Option.forEach(position =>
           instance.editors.source
           |> Atom.TextEditor.setCursorBufferPosition(position)
         );
      Promise.resolved([||]);
    | DispatchCommand(command) => Promise.resolved([|command|])
    | SendRequest(request) =>
      Instance__TextEditors.restoreCursorPosition(
        () => sendRequest(instance, request)->handleCallback,
        instance,
      )
    };
  };

  let rec runEachTask =
    fun
    | [] => Promise.resolved([||])
    | [task, ...tasks] => {
        executeTask(task)
        ->Promise.flatMap(xs =>
            runEachTask(tasks)->Promise.map(xss => Array.concat(xs, xss))
          );
      };
  runEachTask(List.fromArray(tasks));
};

let rec dispatchCommand = (command, instance) => {
  let rec dispatchCommands =
    fun
    | [] => Promise.resolved()
    | [x, ...xs] =>
      dispatchCommand(x, instance)
      ->Promise.flatMap(() => dispatchCommands(xs));

  let before = () => {
    // mark the undo/redo checkpoint
    Instance__TextEditors.startCheckpoint(command, instance);
    // start the spinner
    instance.view.updateIsPending(true);
  };

  let after = () => {
    // mark the undo/redo checkpoint
    Instance__TextEditors.endCheckpoint(instance);
    // stop the spinner
    instance.view.updateIsPending(false);
  };

  // convert the Command into a list of Tasks for later execution
  let tasks = command |> Task__Command.handle |> Array.fromList;

  before()
  // execute the Tasks of the Command
  ->Promise.flatMap(() => execute(tasks, instance))
  // emit `onDispatch` to signal the completion of the Command
  ->Promise.tap(_ => instance.onDispatch.emit())
  // dispatch other Commands derived from this Command
  ->Promise.map(List.fromArray)
  ->Promise.flatMap(dispatchCommands)
  // cleanup
  ->Promise.flatMap(after);
};
