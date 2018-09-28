open ReasonReact;

open Type.TypeChecking;

open Util;

let component = statelessComponent("TypeError");

let make = (~typeError: typeError, ~emacsMessage: string, _children) => {
  ...component,
  render: _self => {
    Js.log(emacsMessage);
    switch (typeError) {
    | GenericDocError(message) => <div> (string(message)) </div>
    | GenericError(message) => <div> (string(message)) </div>
    | ShouldEndInApplicationOfTheDatatype(type_) =>
      <div>
        (
          string(
            "The target of a constructor must be the datatype applied to its parameters, ",
          )
        )
        <Concrete.Expr value=type_ />
        (string(" isn't"))
      </div>
    | ShadowedModule(previous, duplicated, dataOrRecord) =>
      let type_ =
        Type.Syntax.CommonPrim.(
          switch (dataOrRecord) {
          | Some(IsData) => "(datatype) "
          | Some(IsRecord) => "(record) "
          | None => ""
          }
        );
      <div>
        (string("Duplicate definition of module "))
        <C.Name value=duplicated />
        <br />
        (string("Previous definition of " ++ type_ ++ "module "))
        <C.QName value=previous />
      </div>;
    /* (string(" at "))
       1<Range range=previous /> */
    | ShouldBePi(type_) =>
      <div>
        <Concrete.Expr value=type_ />
        (string(" should be a function type, but it isn't"))
      </div>
    | ShouldBeASort(type_) =>
      <div>
        <Concrete.Expr value=type_ />
        (string(" should be a sort, but it isn't"))
      </div>
    | UnequalTerms(_, term1, term2, type_, _) =>
      <div>
        (string("expected : "))
        <Concrete.Expr value=term2 />
        <br />
        (string("  actual : "))
        <Concrete.Expr value=term1 />
        <br />
        (string(" of type : "))
        <Concrete.Expr value=type_ />
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
    | ModuleArityMismatch(moduleName, _, tel) =>
      switch (tel) {
      | None =>
        <div>
          (string("The module "))
          <C.QName value=moduleName />
          (string(" is not parameterized, but is being applied to arguments"))
        </div>
      | Some(telescope) =>
        <div>
          (string("The arguments to "))
          <C.QName value=moduleName />
          (string(" do not fit the telescope "))
          <br />
          <Concrete.Telescope telescope />
        </div>
      }
    | NoRHSRequiresAbsurdPattern(_patterns) =>
      <div>
        (
          string(
            "The right-hand side can only be omitted if there is an absurd pattern, () or {}, in the left-hand side.",
          )
        )
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
    | NoSuchModule(moduleName) =>
      <div> (string("No such module ")) <C.QName value=moduleName /> </div>
    | AmbiguousName(ambiguousName, couldReferTo) =>
      <div>
        (string("Ambiguous name "))
        <C.QName value=ambiguousName />
        (string("."))
        <br />
        (string("It could refer to any one of "))
        <br />
        <ul>
          ...(
               couldReferTo
               |> List.map(value =>
                    <li> (string("    ")) <C.QName value /> </li>
                  )
               |> Array.of_list
             )
        </ul>
      </div>
    | UnregisteredTypeError(json) =>
      <div> (string(Js.Json.stringify(json))) </div>
    };
  },
};
