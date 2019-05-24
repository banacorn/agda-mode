

open ReasonReact;
open Rebase;

type t =
  | AllGoalsWarnings(Emacs__AllGoalsWarnings.t)
  | GoalTypeContext(string)
  | Context(string)
  | Constraints(string)
  | WhyInScope(string)
  | SearchAbout(string)
  | Error(string)
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
  | PlainText(body) => String.isEmpty(body) ? null : <p> {string(body)} </p>
  };
};
