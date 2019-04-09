open Rebase;
open Async;

open Instance__Type;

let getPointedGoal = (instance): Async.t(Goal.t, Command.error) => {
  let pointed = Editors.pointingAt(instance.goals, instance.editors);
  switch (pointed) {
  | Some(goal) => resolve(goal)
  | None => reject(Command.OutOfGoal)
  };
};

let getPointedGoalAt = (cursor, instance): Async.t(Goal.t, Command.error) => {
  let pointed = Editors.pointingAt(~cursor, instance.goals, instance.editors);
  switch (pointed) {
  | Some(goal) => resolve(goal)
  | None => reject(Command.OutOfGoal)
  };
};

let handleOutOfGoal = callback =>
  thenError(error =>
    switch (error) {
    | Command.OutOfGoal => callback()
    | _ => reject(error)
    }
  );

let getGoalIndex = (goal: Goal.t): Async.t((Goal.t, int), Command.error) => {
  switch (goal.index) {
  | Some(index) => resolve((goal, index))
  | None => reject(Command.GoalNotIndexed)
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

let getSelectedTextNode = instance => {
  let getSelectedText = () => {
    instance.editors.source |> Atom.TextEditor.getSelectedText;
  };
  let getLargerSyntaxNode = () => {
    instance.editors.source |> Atom.TextEditor.selectLargerSyntaxNode;
    instance.editors.source |> Atom.TextEditor.getSelectedText;
  };
  let getPointedWord = () => {
    instance.editors.source |> Atom.TextEditor.selectWordsContainingCursors;
    instance.editors.source |> Atom.TextEditor.getSelectedText;
  };

  let selectedText = getSelectedText();

  /* if the user didn't select anything */
  if (String.isEmpty(selectedText)) {
    let largerNode = getLargerSyntaxNode();
    /* this happens when language-agda is not installed */
    if (String.isEmpty(largerNode)) {
      getPointedWord();
    } else {
      let pointedText = getPointedWord();
      /* this happens when the user is hovering on a mixfix/infix operator like _+_ */
      if (pointedText == "_") {
        getLargerSyntaxNode();
      } else {
        pointedText;
      };
    };
  } else {
    selectedText;
  };
};
