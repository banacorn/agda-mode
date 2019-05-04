open Rebase;
open Instance__Type;

/* destroy all goals */
let destroyAll = instance => {
  instance.goals |> Array.forEach(Goal.destroy);
  instance.goals = [||];
};
let find = (index: int, instance) => {
  let found =
    instance.goals
    |> Array.filter(goal =>
         switch (goal.Goal.index) {
         | None => false
         | Some(i) => i == index
         }
       );
  found[0];
};

let getRanges = (instance): array(Atom.Range.t) => {
  instance.goals |> Array.map(goal => goal.Goal.range);
};

let setCursor = (goal, instance) => {
  let position =
    Atom.Point.translate(
      Atom.Point.make(0, 3),
      Atom.Range.start(goal.Goal.range),
    );
  instance.editors.source |> Atom.TextEditor.setCursorBufferPosition(position);
};

let getPositions = (instance): array(Atom.Point.t) => {
  instance
  |> getRanges
  |> Array.map(range =>
       Atom.Point.translate(Atom.Point.make(0, 3), Atom.Range.start(range))
     );
};

let getPreviousGoalPosition = (instance): option(Atom.Point.t) => {
  let previousGoal = ref(None);
  let cursor =
    instance.editors.source |> Atom.TextEditor.getCursorBufferPosition;
  let positions = instance |> getPositions;

  /* assign the previous goal position */
  positions
  |> Array.forEach(position =>
       if (Atom.Point.isLessThan(cursor, position) && previousGoal^ === None) {
         previousGoal := Some(position);
       }
     );

  /* loop back if this is already the first goal */
  if (previousGoal^ === None) {
    previousGoal := positions[Array.length(positions) - 1];
  };

  previousGoal^;
};

let getNextGoalPosition = (instance): option(Atom.Point.t) => {
  let nextGoal = ref(None);
  let cursor =
    instance.editors.source |> Atom.TextEditor.getCursorBufferPosition;
  let positions = instance |> getPositions;
  /* assign the next goal position */
  positions
  |> Array.forEach(position =>
       if (Atom.Point.isGreaterThan(cursor, position) && nextGoal^ === None) {
         nextGoal := Some(position);
       }
     );

  /* if no goal ahead of cursor, then loop back */
  if (nextGoal^ === None) {
    nextGoal := positions[0];
  };

  nextGoal^;
};

/* instantiate all goals */
let instantiateAll = (indices, instance) => {
  open Atom;
  instance |> destroyAll;

  let textEditor = instance.editors.source;
  let filePath = textEditor |> TextEditor.getPath;
  let textBuffer = textEditor |> TextEditor.getBuffer;

  let source = textEditor |> TextEditor.getText;
  let fileType = Goal.FileType.parse(filePath);
  let result = Hole.parse(source, indices, fileType);
  instance.goals =
    result
    |> Array.map((result: Hole.result) => {
         let start =
           textBuffer
           |> TextBuffer.positionForCharacterIndex(fst(result.originalRange));
         let end_ =
           textBuffer
           |> TextBuffer.positionForCharacterIndex(snd(result.originalRange));
         let range = Range.make(start, end_);
         /* modified the hole */
         textEditor
         |> TextEditor.setTextInBufferRange(range, result.content)
         |> ignore;
         /* make it a goal */
         Goal.make(
           instance.editors.source,
           Some(result.index),
           result.modifiedRange,
         );
       });
  ();
};
