open ReasonReact;

open Type.TypeChecking;

open Util;

let component = statelessComponent("TypeError");

let make = (~typeError: typeError, ~emacsMessage: string, _children) => {
  ...component,
  render: _self => {
    Js.log(emacsMessage);
    switch (typeError) {
    | GenericError(message) => <div> (string(message)) </div>
    | ShouldEndInApplicationOfTheDatatype(type_) =>
      <div>
        (
          string(
            "The target of a constructor must be the datatype applied to its parameters, ",
          )
        )
        <Concrete.Expr value=type_.concrete />
        (string(" isn't"))
      </div>
    | ShouldBePi(type_) =>
      <div>
        <Concrete.Expr value=type_.concrete />
        (string(" should be a function type, but it isn't"))
      </div>
    | ShouldBeASort(type_) =>
      <div>
        <Concrete.Expr value=type_.concrete />
        (string(" should be a sort, but it isn't"))
      </div>
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
    | ClashingDefinition(definition, previouslyAt) =>
      <div>
        (string("Multiple definitions of "))
        <C.QName value=definition />
        <br />
        (string("Previous definition at "))
        <Range range=previouslyAt />
      </div>
    | NotInScope(pairs) =>
      let forgetSpaceColon = name =>
        name |> C.QName.toString |> String.contains(_, ':');
      let forgetSpaceArrow = name =>
        name |> C.QName.toString |> contains(_, "->");
      let pair = ((name, suggestions)) => {
        let colon = forgetSpaceColon(name);
        let arrow = forgetSpaceArrow(name);
        let hasSuggestions = List.length(suggestions) !== 0;
        let shouldRender = colon || arrow || hasSuggestions;
        <li>
          <C.QName value=name />
          (string(" is not in scope"))
          (
            shouldRender ?
              <p>
                (
                  colon ?
                    <> (string("did you forget space around the ':'?")) </> :
                    null
                )
                (
                  arrow ?
                    <> (string("did you forget space around the '->'?")) </> :
                    null
                )
                (
                  hasSuggestions ?
                    <>
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
              </p> :
              null
          )
        </li>;
      };
      <ul> ...(pairs |> List.map(pair) |> Array.of_list) </ul>;
    | UnregisteredTypeError(json) =>
      <div> (string(Js.Json.stringify(json))) </div>
    };
  },
};
