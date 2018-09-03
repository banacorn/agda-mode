let component = ReasonReact.statelessComponent("TypeError");

open! Type.Agda.TypeChecking;

let make = (~typeError: typeError, ~emacsMessage: string, _children) => {
  ...component,
  render: _self =>
    switch (typeError) {
    | UnequalTerms(_, _, _, _, _) =>
      <p> (ReasonReact.string("UnequalTerms!")) </p>
    | UnregisteredTypeError(json) =>
      <p> (ReasonReact.string(Js.Json.stringify(json))) </p>
    },
};
