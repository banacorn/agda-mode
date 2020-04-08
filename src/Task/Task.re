type header = string;
type placeholder = string;

type editorTask =
  | Save;

module Highlightings = {
  type t =
    | AddDirectly(array(Highlighting.Annotation.t))
    | AddIndirectly(string);
};

type goalTask =
  | GetPointed(callback(Goal.t))
  | GetPointedOr(callback(Goal.t), callback(unit))
  | JumpToTheNext
  | JumpToThePrevious

and t =
  | WithInstance(callbackP(Instance__Type.t))
  | WithConnection(callbackP(Connection.t))
  | Disconnect
  // View
  | Activate
  | Deactivate
  | Display(header, Type.View.Header.style, Body.t)
  | Inquire(header, placeholder, string, callback(string))
  // Editor
  | Editor(editorTask)
  // Goals
  | Goals(goalTask)
  // Highlightings
  | Highlightings(Highlightings.t)
  // Request
  | DispatchCommand(Command.t)
  | SendRequest(Request.t)
and callback('a) = 'a => list(t)
and callbackP('a) =
  'a => Promise.t(Rebase.result(list(t), Instance__Type.error));

let return = x => Promise.resolved(Rebase.Ok(x));
