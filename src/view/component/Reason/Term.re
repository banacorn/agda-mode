let component = ReasonReact.statelessComponent("Term");

open! Type.Syntax;

let make = (~value: Internal.term, _children) => {
  ...component,
  render: _self => <span> (ReasonReact.string("some term")) </span>,
};
