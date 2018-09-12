let component = ReasonReact.statelessComponent("Call");

open ReasonReact;

open Type.TypeChecking;

open Util;

let make = (~call, _children) => {
  ...component,
  render: _self =>
    switch (call) {
    | CheckClause(type_, lhs) =>
      <span>
        (string("when checking that the clause"))
        <Concrete.LHS lhs />
        (string("has type"))
        <Concrete.Expr value=type_.concrete />
      </span>
    | CheckPattern(pattern, type_) =>
      <span>
        (string("when checking that the pattern"))
        <Concrete.Pattern pattern />
        (string("has type"))
        <Concrete.Expr value=type_.concrete />
      </span>
    | CheckLetBinding(declarations) =>
      <span>
        (string("when checking that the let biding"))
        (
          declarations
          |> List.map(decl => <Concrete.Declaration value=decl />)
          |> sepBy(<br />)
        )
      </span>
    | InferExpr(expr) =>
      <span>
        (string("when inferring the type of"))
        <Concrete.Expr value=expr />
      </span>
    | CheckExprCall(_, expr, type_) =>
      <span>
        (string("when checking that the expression "))
        <Concrete.Expr value=expr />
        (string(" has type "))
        <Concrete.Expr value=type_.concrete />
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
                            ...((_, value) => <Concrete.Expr value />)
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
          <Concrete.Expr value=type_.concrete />
        </span>
      )
    | ScopeCheckExpr(expr) =>
      <span>
        (string("when scope checking "))
        <Concrete.Expr value=expr />
      </span>
    | _ => <span> (string("<Call> unimplemented")) </span>
    },
};
