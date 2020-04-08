type error =
  | ParseError(array(Parser.Error.t))
  | ConnectionError(Connection.Error.t)
  // Cancelled: never makes its way to Agda
  | Cancelled
  // Other reasons, also never make their way to Agda
  | OutOfGoal;

type history = {
  mutable checkpoints: array(int),
  mutable needsReloading: bool,
};

type t = {
  editors: Editors.t,
  view: View.t,
  // states
  history,
  mutable isLoaded: bool,
  mutable highlightings: array(Highlighting.t),
  mutable goals: array(Goal.t),
  mutable connection: option(Connection.t),
  mutable runningInfo: RunningInfo.t,
  // event emitter for testing
  onDispatch: Event.t(unit),
  onConnectionError: Event.t(Connection.Error.t),
};
