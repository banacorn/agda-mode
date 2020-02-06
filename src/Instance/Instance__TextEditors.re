open! Rebase;

open Instance__Type;

let getPath = instance => {
  instance.editors.source
  |> Atom.TextEditor.getPath
  |> Option.getOr("untitled")
  |> Parser.filepath;
};

let pointingAt = (~cursor=?, instance): option(Goal.t) => {
  let cursor_ =
    switch (cursor) {
    | None =>
      instance.editors.source |> Atom.TextEditor.getCursorBufferPosition
    | Some(x) => x
    };

  let pointedGoals =
    instance.goals
    |> Array.filter(goal =>
         goal.Goal.range |> Atom.Range.containsPoint(cursor_)
       );
  /* return the first pointed goal */
  pointedGoals[0];
};

let getPointedGoal = (instance): Promise.t(result(Goal.t, error)) => {
  let pointed = pointingAt(instance);
  switch (pointed) {
  | Some(goal) => Promise.resolved(Ok(goal))
  | None => Promise.resolved(Error(OutOfGoal))
  };
};

let getPointedGoalAt = (cursor, instance): Promise.t(result(Goal.t, error)) => {
  let pointed = pointingAt(~cursor, instance);
  switch (pointed) {
  | Some(goal) => Promise.resolved(Ok(goal))
  | None => Promise.resolved(Error(OutOfGoal))
  };
};

let handleOutOfGoal = (promise, callback) =>
  promise->Promise.flatMapError(
    fun
    | OutOfGoal => callback()
    | error => Promise.resolved(Error(error)),
  );

let getGoalIndex = (goal: Goal.t): Promise.t(result((Goal.t, int), error)) => {
  switch (goal.index) {
  | Some(index) => Promise.resolved(Ok((goal, index)))
  | None => Promise.resolved(Error(GoalNotIndexed))
  };
};

/* shift cursor if in certain goal */
let updateCursorPosition = (callback, instance) => {
  let cursor =
    instance.editors.source |> Atom.TextEditor.getCursorBufferPosition;
  let result = callback();

  getPointedGoalAt(cursor, instance)
  /* reposition the cursor in the goal only if it's a fresh hole (coming from '?') */
  ->Promise.mapOk(goal => {
      let fresh = Goal.isEmpty(goal);
      if (fresh) {
        let delta = Atom.Point.make(0, 3);
        let newPosition =
          Atom.Point.translate(delta, goal.range |> Atom.Range.start);
        Js.Global.setTimeout(
          () =>
            instance.editors.source
            |> Atom.TextEditor.setCursorBufferPosition(newPosition),
          0,
        )
        |> ignore;
      } else {
        instance.editors.source
        |> Atom.TextEditor.setCursorBufferPosition(cursor);
      };
    })
  ->handleOutOfGoal(_ => {
      instance.editors.source
      |> Atom.TextEditor.setCursorBufferPosition(cursor);
      Promise.resolved(Ok());
    })
  |> ignore;

  /* return the result of the callback */
  result;
};

//
//  History Management
//

// sometimes a child command may be invoked by some parent command,
// in that case, both the parent and the child command should be
// regarded as a single action

let startCheckpoint = (command, instance) => {
  let checkpoint = instance.editors.source |> Atom.TextEditor.createCheckpoint;
  instance.history.checkpoints |> Js.Array.push(checkpoint) |> ignore;

  // see if reloading is needed on undo
  if (Array.length(instance.history.checkpoints) === 1) {
    instance.history.needsReloading =
      Command.Primitive.(
        switch (command) {
        | SolveConstraints
        | Give
        | Refine
        | Auto
        | Case => true
        | _ => false
        }
      );
  };
};

let endCheckpoint = instance => {
  let checkpoint = Js.Array.pop(instance.history.checkpoints);
  // group changes if it's a parent command
  if (Array.length(instance.history.checkpoints) === 0) {
    checkpoint
    |> Option.forEach(n =>
         instance.editors.source
         |> Atom.TextEditor.groupChangesSinceCheckpoint(n)
         |> ignore
       );
  };
  ();
};