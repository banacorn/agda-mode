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

// Request => Responses
let sendRequest =
    (instance, request: Request.t)
    : Promise.t(result(list(Task.t), Instance__Type.error)) => {
  Js.log2(" <<< ", request);
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
            Js.log2(" >>> ", Response.toString(response));
            let tasks = Task__Response.handle(response);
            switch (response) {
            | MakeCase(_) => Js.log(Array.fromList(tasks))
            | _ => ()
            };
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
        (
          tasks: array(t),
          instance: Instance__Type.t,
          errorHandler: Instance__Type.error => Promise.t(unit),
        )
        : Promise.t(array(Command.t)) => {
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

  let executeTasks = x => {
    Promise.flatMap(
      x,
      fun
      | Ok(tasks) => {
          // filter commands out
          let (otherTasks, commands) = filterDispatchCommand(tasks);
          // execute other tasks
          execute(otherTasks, instance, errorHandler)
          // concat the new commands generated from other tasks
          ->Promise.map(newCommands => Array.concat(newCommands, commands));
        }
      | Error(error) => errorHandler(error)->Promise.map(() => [||]),
    );
  };
  let executeTask = task => {
    Js.log2(" --- ", task);

    switch (task) {
    | WithInstance(callback) => callback(instance)->executeTasks
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
      ->executeTasks
    | Editor(Save) =>
      instance.editors.source
      ->Atom.TextEditor.save
      ->Promise.Js.fromBsPromise
      ->Promise.Js.toResult
      ->Promise.mapError(_ => Instance__Type.Cancelled)
      ->Promise.mapOk(_ => [])
      ->executeTasks
    | Goals(GetPointed(callback)) =>
      Instance__TextEditors.getPointedGoal(instance)
      ->Promise.flatMapOk(Instance__TextEditors.getGoalIndex)
      ->Promise.mapOk(callback)
      ->executeTasks
    | Goals(GetPointedOr(callback, handler)) =>
      Instance__TextEditors.getPointedGoal(instance)
      ->Promise.flatMapOk(Instance__TextEditors.getGoalIndex)
      ->Promise.mapOk(callback)
      ->Promise.map(
          fun
          | Error(OutOfGoal) => Ok(handler())
          | others => others,
        )
      ->executeTasks
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
    // Instance__TextEditors.startCheckpoint(command, instance);
    // let program =
    //   command |> Task__Command.handle |> run(instance, errorHandler);
    // program->Promise.tap(() =>
    //   Instance__TextEditors.endCheckpoint(instance)
    // );
    | SendRequest(request) =>
      Instance__TextEditors.restoreCursorPosition(
        () => sendRequest(instance, request)->executeTasks,
        instance,
      )
    // sendRequest(instance, request)->executeTasks
    // Instance__TextEditors.restoreCursorPosition(
    //   () => sendRequest(instance, request)->runTasks,
    //   instance,
    // )
    // Promise.resolved();
    // sendRequest2(instance, errorHandler, request)
    // ->Promise.flatMap(
    //     fun
    //     | Ok () => Promise.resolved()
    //     | Error(error) => errorHandler(error),
    //   )
    // instance.view.updateIsPending(true)
    // ->Promise.flatMap(() => sendRequest(instance, request)->runTasks)
    // ->Promise.flatMap(() => sendRequest(instance, request))
    // ->Promise.tapOk(_ => {
    //     instance.onDispatch.emit(Ok());
    //     instance.view.updateIsPending(false) |> ignore;
    //   })
    // ->Promise.flatMap(tasks => {
    //     instance.onDispatch.emit(Ok());
    //     instance.view.updateIsPending(false);
    //   })
    // ->Promise.map(_ => ())
    //   ->Promise.flatMapOk(handleRequest(instance, handleResponse))
    //   ->Promise.tap(_ => endCheckpoint(instance))
    //   ->Promise.flatMap(x =>
    //       instance.view.updateIsPending(false)->Promise.map(() => x)
    //     )
    //   ->Promise.mapOk(_ => instance.onDispatch.emit(Ok()))
    //   ->Promise.tapError(error => instance.onDispatch.emit(Error(error)));
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

  Task__Command.handle(command)
  ->Array.fromList
  ->execute(instance, error =>
      Instance__Handler.handleCommandError(
        Promise.resolved(Error(error)),
        instance,
      )
      ->Promise.map(_ => ())
    )
  ->Promise.map(List.fromArray)
  ->Promise.flatMap(dispatchCommands);
};
