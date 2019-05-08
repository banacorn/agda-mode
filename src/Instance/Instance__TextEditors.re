open Rebase;
open Async;

open Instance__Type;

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

let getPointedGoal = (instance): Async.t(Goal.t, error) => {
  let pointed = pointingAt(instance);
  switch (pointed) {
  | Some(goal) => resolve(goal)
  | None => reject(OutOfGoal)
  };
};

let getPointedGoalAt = (cursor, instance): Async.t(Goal.t, error) => {
  let pointed = pointingAt(~cursor, instance);
  switch (pointed) {
  | Some(goal) => resolve(goal)
  | None => reject(OutOfGoal)
  };
};

let handleOutOfGoal = callback =>
  thenError(error =>
    switch (error) {
    | OutOfGoal => callback()
    | _ => reject(error)
    }
  );

let getGoalIndex = (goal: Goal.t): Async.t((Goal.t, int), error) => {
  switch (goal.index) {
  | Some(index) => resolve((goal, index))
  | None => reject(GoalNotIndexed)
  };
};

/* shift cursor if in certain goal */
let recoverCursor = (callback, instance) => {
  let cursor =
    instance.editors.source |> Atom.TextEditor.getCursorBufferPosition;
  let result = callback();

  instance
  |> getPointedGoalAt(cursor)
  /* reposition the cursor in the goal only if it's a fresh hole (coming from '?') */
  |> thenOk(goal => {
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
         resolve();
       } else {
         instance.editors.source
         |> Atom.TextEditor.setCursorBufferPosition(cursor);
         resolve();
       };
     })
  |> handleOutOfGoal(_ => {
       instance.editors.source
       |> Atom.TextEditor.setCursorBufferPosition(cursor);
       resolve();
     })
  |> ignore;

  /* return the result of the callbak */
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
  instance.checkpointStack |> Js.Array.push(checkpoint) |> ignore;

  // see if reloading is needed on undo
  if (Array.length(instance.checkpointStack) === 1) {
    instance.checkpointNeedReload =
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
  let checkpoint = Js.Array.pop(instance.checkpointStack);
  // group changes if it's a parent command
  if (Array.length(instance.checkpointStack) === 0) {
    checkpoint
    |> Option.forEach(n =>
         instance.editors.source
         |> Atom.TextEditor.groupChangesSinceCheckpoint(n)
         |> ignore
       );
  };
  ();
};
