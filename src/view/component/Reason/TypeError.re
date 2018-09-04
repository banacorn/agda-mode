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
        <Term value=term2 />
        <br />
        (ReasonReact.string("  actual : "))
        <Term value=term1 />
        <br />
      </div>
    | UnregisteredTypeError(json) =>
      <div> (ReasonReact.string(Js.Json.stringify(json))) </div>
    };
  },
};
