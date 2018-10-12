let component = ReasonReact.statelessComponent("Call");

open ReasonReact;

open Type.TypeChecking;

open Concrete;

open Name;

open Util;

let make = (~call, _children) => {
  ...component,
  render: _self =>
    switch (call) {
    | CheckClause(type_, declarations) =>
      <span>
        (string("when checking that the clause "))
        (
          declarations
          |> List.map(value => <Declaration value />)
          |> sepBy(<br />)
        )
        (string(" has type "))
        <Expr value=type_ />
      </span>
    | CheckPattern(pattern, type_) =>
      <span>
        (string("when checking that the pattern "))
        <Pattern pattern />
        (string(" has type "))
        <Expr value=type_ />
      </span>
    | CheckLetBinding(declarations) =>
      <span>
        (string("when checking that the let biding "))
        (
          declarations
          |> List.map(decl => <Declaration value=decl />)
          |> sepBy(<br />)
        )
      </span>
    | InferExpr(expr) =>
      <span>
        (string("when inferring the type of "))
        <Expr value=expr />
      </span>
    | CheckExprCall(_, expr, type_) =>
      <span>
        (string("when checking that the expression "))
        <Expr value=expr />
        (string(" has type "))
        <Expr value=type_ />
      </span>
    | CheckArguments(_, exprs, type_) =>
      CommonPrim.(
        <span>
          (string("when checking that "))
          (
            exprs
            |> List.map(value =>
                 <Arg value>
                   ...(
                        (prec, value) =>
                          <Named prec value>
                            ...((_, value) => <Expr value />)
                          </Named>
                      )
                 </Arg>
               )
            |> sepBy(string(" "))
          )
          (
            List.length(exprs) > 1 ?
              string(" are valid arguments ") :
              string(" is a valid argument ")
          )
          (string("to a function of type "))
          <Expr value=type_ />
        </span>
      )
    | CheckTargetType(_range, inf, exp) =>
      <span>
        (string("when checking that the inferred type of an application "))
        <br />
        <Expr value=inf />
        <br />
        (string("matches the expected type "))
        <br />
        <Expr value=exp />
      </span>
    | CheckConstructor(declaration, constructor) =>
      <span>
        (string("when checking the constructor "))
        <QName value=constructor />
        (string(" in the declaration of "))
        <QName value=declaration />
      </span>
    | ScopeCheckExpr(expr) =>
      <span> (string("when scope checking ")) <Expr value=expr /> </span>
    | ScopeCheckDeclaration(declarations) =>
      <span>
        (
          string(
            "when scope checking the declaration "
            ++ (List.length(declarations) > 1 ? "s" : ""),
          )
        )
        (
          declarations
          |> List.map(value => <Declaration value />)
          |> sepBy(<br />)
        )
      </span>
    | _ => <span> (string("<Call> unimplemented")) </span>
    },
};
