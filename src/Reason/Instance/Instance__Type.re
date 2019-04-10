type t = {
  mutable loaded: bool,
  editors: Editors.t,
  view: View.Handles.t,
  mutable highlightings: array(Highlighting.t),
  mutable goals: array(Goal.t),
  mutable connection: option(Connection.t),
  dispatch: (Command.Primitive.t, t) => Async.t(unit, Command.error),
  handleResponses: (t, array(Response.t)) => Async.t(unit, Command.error),
};
