let component = ReasonReact.statelessComponent("TypeError");

open! Type.TypeChecking;

let make = (~typeError: typeError, ~emacsMessage: string, _children) => {
  ...component,
  render: _self => {
    Js.log(typeError);
    switch (typeError) {
    | UnequalTerms(_, term1, term2, _, _) =>
      <div>
        (ReasonReact.string("expected : "))
        <Expr value=term2.concrete />
        <br />
        (ReasonReact.string("  actual : "))
        <Expr value=term1.concrete />
        <br />
      </div>
    | UnregisteredTypeError(json) =>
      <div> (ReasonReact.string(Js.Json.stringify(json))) </div>
    };
  },
};
