let component = ReasonReact.statelessComponent("Expr");

open! Type.Syntax;

let make = (~value: Concrete.expr, _children) => {
  ...component,
  render: _self => <span> (ReasonReact.string("some expr")) </span>,
};
