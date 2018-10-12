open ReasonReact;

open Type.Interaction;

open Concrete;

open Type.Syntax.Concrete;

open Util;

let component = ReasonReact.statelessComponent("OutputConstraint");

let make = (~meta: outputConstraint(expr, expr), _children) => {
  ...component,
  render: _self =>
    switch (meta) {
    | OfType(e, t) =>
      <li> <Expr value=e /> (string(" : ")) <Expr value=t /> </li>
    | JustType(e) => <li> (string("Type ")) <Expr value=e /> </li>
    | JustSort(e) => <li> (string("Sort ")) <Expr value=e /> </li>
    | CmpInType(cmp, t, e, e') =>
      <li>
        <Expr value=e />
        <Comparison cmp />
        <Expr value=e' />
        (string(" : "))
        <Expr value=t />
      </li>
    | CmpElim(t, es, es') =>
      <li>
        (es |> List.map(value => <Expr value />) |> sepBy(string(", ")))
        <Comparison cmp=Type.TypeChecking.CmpEq />
        (es' |> List.map(value => <Expr value />) |> sepBy(string(", ")))
        (string(" : "))
        <Expr value=t />
      </li>
    | CmpTypes(cmp, t, t') =>
      <li> <Expr value=t /> <Comparison cmp /> <Expr value=t' /> </li>
    | CmpLevels(cmp, t, t') =>
      <li> <Expr value=t /> <Comparison cmp /> <Expr value=t' /> </li>
    | CmpTeles(cmp, t, t') =>
      <li> <Expr value=t /> <Comparison cmp /> <Expr value=t' /> </li>
    | CmpSorts(cmp, t, t') =>
      <li> <Expr value=t /> <Comparison cmp /> <Expr value=t' /> </li>
    | Guard(_o, _pid) =>
      <li> (string("Unimplemented: outputConstraint::Guard")) </li>
    | Assign(m, e) =>
      <li> <Expr value=m /> (string(" := ")) <Expr value=e /> </li>
    | TypedAssign(m, e, a) =>
      <li>
        <Expr value=m />
        (string(" := "))
        <Expr value=e />
        (string(" :? "))
        <Expr value=a />
      </li>
    | PostponedCheckArgs(m, es, t, t') =>
      <li>
        <Expr value=m />
        (string(" := (_ : "))
        <Expr value=t />
        (string(") "))
        (
          es
          |> List.map(value =>
               <> (string("(")) <Expr value /> (string(")")) </>
             )
          |> sepBy(string(", "))
        )
        (string(": "))
        <Expr value=t' />
      </li>
    | IsEmptyType(e) => <li> (string("Is empty: ")) <Expr value=e /> </li>
    | SizeLtSat(e) =>
      <li> (string("Not empty type of sizes: ")) <Expr value=e /> </li>
    | FindInScopeOF(_s, _t, _cs) =>
      <li> (string("Unimplemented: OutputConstraint::FindInScopeOF")) </li>
    | PTSInstance(_a, _b) =>
      <li> (string("Unimplemented: OutputConstraint::PTSInstance")) </li>
    },
};
