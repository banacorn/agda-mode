type error =
  | ParseError(Parser.error)
  | ConnectionError(Connection.Error.t)
  /* Cancelled: never makes its way to Agda */
  | Cancelled
  /* Other reasons, also never make their way to Agda */
  | GoalNotIndexed
  | OutOfGoal;

type t = {
  mutable isLoaded: bool,
  editors: Editors.t,
  view: View.t,
  mutable checkpointStack: array(int),
  mutable checkpointNeedReload: bool,
  mutable highlightings: array(Highlighting.t),
  mutable goals: array(Goal.t),
  mutable connection: option(Connection.t),
  mutable runningInfo: RunningInfo.t,
  dispatch: (Command.Primitive.t, t) => Async.t(unit, error),
  handleResponses: (t, array(Response.t)) => Async.t(unit, error),
};
