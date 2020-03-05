type header = string;
type placeholder = string;

type t =
  | WithInstance(callbackP(Instance.t))
  | Display(header, Type.View.Header.style, Body.t)
  | Inquire(header, placeholder, string, callback(string))
  | GetPointedGoal(callback((Goal.t, int)))
  | GetPointedGoalOr(callback((Goal.t, int)), callback(unit))
  | DispatchCommand(Command.t)
  | SendRequest(Request.t)
and callback('a) = 'a => list(t)
and callbackP('a) =
  'a => Promise.t(Rebase.result(list(t), Instance__Type.error));

let return = x => Promise.resolved(Rebase.Ok(x));
