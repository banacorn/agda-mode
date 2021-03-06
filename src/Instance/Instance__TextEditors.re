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
    | None => Atom.TextEditor.getCursorBufferPosition(instance.editors.source)
    | Some(x) => x
    };

  let pointedGoals =
    instance.goals
    |> Array.filter(goal =>
         Atom.Range.containsPoint(cursor_, goal.Goal.range)
       );
  // return the first pointed goal
  pointedGoals[0];
};

let getPointedGoal = (instance): Promise.t(result(Goal.t, error)) => {
  let pointed = pointingAt(instance);
  switch (pointed) {
  | Some(goal) => Promise.resolved(Ok(goal))
  | None => Promise.resolved(Error(OutOfGoal))
  };
};

// execute the callback
//  if it's pointing at some empty hole
//    then move the cursor inside the empty hole
//    else restore the cursor to its original position
let restoreCursorPosition = (callback, instance) => {
  let originalPosition =
    Atom.TextEditor.getCursorBufferPosition(instance.editors.source);

  callback()
  ->Promise.map(result => {
      let pointed = pointingAt(~cursor=originalPosition, instance);
      switch (pointed) {
      | Some(goal) =>
        if (Goal.isEmpty(goal)) {
          Instance__Goals.setCursor(goal, instance);
        } else {
          Atom.TextEditor.setCursorBufferPosition(
            originalPosition,
            instance.editors.source,
          );
        }
      | None =>
        Atom.TextEditor.setCursorBufferPosition(
          originalPosition,
          instance.editors.source,
        )
      };
      result;
    });
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
      Command.(
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
