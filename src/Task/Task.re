type header = string;
type placeholder = string;

type editor =
  | Save;

type goal =
  | GetPointed(callback((Goal.t, int)))
  | GetPointedOr(callback((Goal.t, int)), callback(unit))
  | JumpToTheNext
  | JumpToThePrevious

and t =
  | WithInstance(callbackP(Instance__Type.t))
  | Disconnect
  // View
  | Activate
  | Deactivate
  | Display(header, Type.View.Header.style, Body.t)
  | Inquire(header, placeholder, string, callback(string))
  // Editor
  | Editor(editor)
  // Goals
  | Goals(goal)
  // Request
  | DispatchCommand(Command.t)
  | SendRequest(Request.t)
and callback('a) = 'a => list(t)
and callbackP('a) =
  'a => Promise.t(Rebase.result(list(t), Instance__Type.error));

let return = x => Promise.resolved(Rebase.Ok(x));
