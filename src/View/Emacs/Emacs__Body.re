open ReasonReact;

type t =
  | AllGoalsWarnings(Emacs__AllGoalsWarnings.t)
  | GoalTypeContext(string)
  | Context(string)
  | Constraints(string)
  | WhyInScope(string)
  | SearchAbout(string)
  | Error(string)
  | ParseError(Connection.t)
  | PlainText(string);

[@react.component]
let make = (~data: t) => {
  switch (data) {
  | AllGoalsWarnings(value) => <Emacs__AllGoalsWarnings value />
  | GoalTypeContext(body) => <Emacs__GoalTypeContext body />
  | Context(body) => <Emacs__Context body />
  | Constraints(body) => <Emacs__Context body />
  | WhyInScope(body) => <Emacs__WhyInScope body />
  | SearchAbout(body) => <Emacs__SearchAbout body />
  | Error(body) => <Emacs__Error body />
  | ParseError(connection) => <Emacs__ParseError connection />
  | PlainText(body) => body == "" ? null : <p> {string(body)} </p>
  };
};