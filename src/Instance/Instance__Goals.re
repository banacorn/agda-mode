open Rebase;
open Instance__Type;

// destroy all goals
let destroyAll = instance => {
  instance.goals |> Array.forEach(Goal.destroy);
  instance.goals = [||];
};
let find = (index: int, instance) => {
  let found = instance.goals |> Array.filter(goal => goal.Goal.index == index);
  found[0];
};

// set the cursor inside the goal
let setCursor = (goal, instance) => {
  let position =
    Atom.Point.translate(
      Atom.Point.make(0, 3),
      Atom.Range.start(goal.Goal.range),
    );
  Atom.TextEditor.setCursorBufferPosition(position, instance.editors.source);
};

let getPositions = (instance): array(Atom.Point.t) => {
  instance.goals
  |> Array.map(goal => goal.Goal.range)
  |> Array.map(range =>
       Atom.Point.translate(Atom.Point.make(0, 3), Atom.Range.start(range))
     );
};

let getPreviousGoalPosition = (instance): option(Atom.Point.t) => {
  let previousGoal = ref(None);
  let cursor =
    Atom.TextEditor.getCursorBufferPosition(instance.editors.source);
  let positions = getPositions(instance);

  /* assign the previous goal position */
  positions
  |> Array.forEach(position =>
       if (Atom.Point.isLessThan(cursor, position)) {
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
    Atom.TextEditor.getCursorBufferPosition(instance.editors.source);
  let positions = getPositions(instance);
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

// instantiate all goals
let instantiateAll = (indices, instance) => {
  open Atom;
  destroyAll(instance);

  let textEditor = instance.editors.source;
  let filePath =
    textEditor
    |> Atom.TextEditor.getPath
    |> Option.getOr("untitled")
    |> Parser.filepath;
  let textBuffer = TextEditor.getBuffer(textEditor);

  let source = TextEditor.getText(textEditor);
  let fileType = Goal.FileType.parse(filePath);
  let result = Hole.parse(source, indices, fileType);
  instance.goals =
    result
    |> Array.map((result: Hole.Diff.t) => {
         let start =
           TextBuffer.positionForCharacterIndex(
             fst(result.originalRange),
             textBuffer,
           );
         let end_ =
           TextBuffer.positionForCharacterIndex(
             snd(result.originalRange),
             textBuffer,
           );
         let range = Range.make(start, end_);
         /* modified the hole */
         textEditor
         |> TextEditor.setTextInBufferRange(range, result.content)
         |> ignore;
         /* make it a goal */
         Goal.make(
           instance.editors.source,
           result.index,
           result.modifiedRange,
         );
       });
  ();
};