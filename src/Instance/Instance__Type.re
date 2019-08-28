type error =
  | ParseError(array(Parser.Error.t))
  | ConnectionError(Connection.Error.t)
  /* Cancelled: never makes its way to Agda */
  | Cancelled
  /* Other reasons, also never make their way to Agda */
  | GoalNotIndexed
  | OutOfGoal;

type history = {
  mutable checkpoints: array(int),
  mutable needsReloading: bool,
};

type t = {
  mutable isLoaded: bool,
  editors: Editors.t,
  view: View.t,
  history,
  mutable highlightings: array(Highlighting.t),
  mutable goals: array(Goal.t),
  mutable connection: option(Connection.t),
  mutable runningInfo: RunningInfo.t,
  dispatch: (Command.Primitive.t, t) => Async.t(unit, error),
  handleResponse: (t, Response.t) => Async.t(unit, error),
  handles: View.handles,
};
