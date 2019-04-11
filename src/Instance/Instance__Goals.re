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
