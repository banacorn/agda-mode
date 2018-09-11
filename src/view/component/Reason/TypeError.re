let component = ReasonReact.statelessComponent("TypeError");

open! Type.TypeChecking;

let make = (~typeError: typeError, ~emacsMessage: string, _children) => {
  ...component,
  render: _self => {
    Js.log(emacsMessage);
    switch (typeError) {
    | UnequalTerms(_, term1, term2, type_, _) =>
      <div>
        (ReasonReact.string("expected : "))
        <Concrete.Expr value=term2.concrete />
        <br />
        (ReasonReact.string("  actual : "))
        <Concrete.Expr value=term1.concrete />
        <br />
        (ReasonReact.string(" of type : "))
        <Concrete.Expr value=type_.concrete />
        <br />
      </div>
    | UnregisteredTypeError(json) =>
      <div> (ReasonReact.string(Js.Json.stringify(json))) </div>
    };
  },
};
