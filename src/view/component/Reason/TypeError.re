open ReasonReact;

open Type.TypeChecking;

open Util;

let component = statelessComponent("TypeError");

let make = (~typeError: typeError, ~emacsMessage: string, _children) => {
  ...component,
  render: _self => {
    Js.log(emacsMessage);
    switch (typeError) {
    | UnequalTerms(_, term1, term2, type_, _) =>
      <div>
        (string("expected : "))
        <Concrete.Expr value=term2.concrete />
        <br />
        (string("  actual : "))
        <Concrete.Expr value=term1.concrete />
        <br />
        (string(" of type : "))
        <Concrete.Expr value=type_.concrete />
        <br />
      </div>
    | NotInScope(pairs) =>
      let forgetSpaceColon = name =>
        name |> C.QName.toString |> String.contains(_, ':');
      let forgetSpaceArrow = name =>
        name |> C.QName.toString |> contains(_, "->");
      let pair = ((name, suggestions)) =>
        <li>
          <C.QName value=name />
          <p className="padded">
            (string(" is not in scope"))
            (
              forgetSpaceColon(name) ?
                <>
                  <br />
                  (string("did you forget space around the ':'?"))
                </> :
                null
            )
            (
              forgetSpaceArrow(name) ?
                <>
                  <br />
                  (string("did you forget space around the '->'?"))
                </> :
                null
            )
            (
              List.length(suggestions) !== 0 ?
                <>
                  <br />
                  (string("did you mean "))
                  (
                    suggestions
                    |> List.map(value => <C.QName value />)
                    |> sepBy(string(" or "))
                  )
                  (string(" ?"))
                </> :
                null
            )
          </p>
        </li>;
      <ul> ...(pairs |> List.map(pair) |> Array.of_list) </ul>;
    | UnregisteredTypeError(json) =>
      <div> (string(Js.Json.stringify(json))) </div>
    };
  },
};
