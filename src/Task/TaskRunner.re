open Task;

open! Rebase;
open Rebase.Fn;

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

// Request => Responses
let rec sendRequest2 =
        (instance, errorHandler, request)
        : Promise.t(result(unit, Instance__Type.error)) => {
  let (promise, resolve) = Promise.pending();
  Js.log2(" <<< ", request);
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
      Log.createEntry(request, connection.log);

      // prepare input for Agda
      let inputForAgda = Request.toAgdaReadableString(packedRequest);

      // store responses from Agda
      let resultsOfResponseHandling = ref([]);
      let parseErrors = ref([]);
      open Parser.Incr.Event;
      let onResponse =
        fun
        | Ok(Yield(Ok(response))) => {
            Js.log2(" >>> ", Response.toString(response));
            // feed the response to the handler
            // the handler should return a promise which resolves on complete
            let result =
              instance
              |> Instance__TextEditors.restoreCursorPosition(() => {
                   let tasks = Task__Response.handle(response);
                   run(instance, errorHandler, tasks);
                 });
            resultsOfResponseHandling :=
              [result, ...resultsOfResponseHandling^];
          }
        | Ok(Yield(Error(error))) =>
          parseErrors := [error, ...parseErrors^]
        | Ok(Stop) =>
          if (List.isEmpty(parseErrors^)) {
            // no parse errors, wait until all of the response have been handled
            (resultsOfResponseHandling^)
            ->Promise.all
            ->Promise.get(_results => resolve(Ok()));
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
}
// run the Tasks
and run =
    (
      instance: Instance__Type.t,
      errorHandler: Instance__Type.error => Promise.t(unit),
      tasks: list(t),
    )
    : Promise.t(unit) => {
  let runTasks = x => {
    Promise.flatMap(
      x,
      fun
      | Ok(tasks) => run(instance, errorHandler, tasks)
      | Error(error) => errorHandler(error),
    );
  };
  let runTask = task => {
    Js.log2(" --- ", task);

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
    | SendRequest(request) => sendRequest(instance, request)->runTasks
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

  let rec runEach =
    fun
    | [] => Promise.resolved()
    | [x, ...xs] => {
        runTask(x)->Promise.flatMap(() => runEach(xs));
      };

  // If there are any Task of DispatchCommand
  // pick them out and put them back of the line
  let postponeDispatchCommand = tasks => {
    let isDispatchCommand =
      fun
      | DispatchCommand(_) => true
      | _ => false;
    let dispatches = List.filter(isDispatchCommand, tasks);
    let otherTasks = List.filter(isDispatchCommand >> (!), tasks);
    if (!List.isEmpty(dispatches)) {
      Js.log2(
        Array.fromList(tasks),
        Array.fromList(List.concat(otherTasks, dispatches)),
      );
    };
    List.concat(otherTasks, dispatches);
  };

  tasks |> postponeDispatchCommand |> runEach;
};

let dispatchCommand = (command, instance) =>
  Task__Command.handle(command)
  |> run(instance, error =>
       Instance__Handler.handleCommandError(
         Promise.resolved(Error(error)),
         instance,
       )
       ->Promise.map(_ => ())
     );
