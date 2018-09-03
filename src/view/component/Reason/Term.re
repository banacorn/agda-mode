let component = ReasonReact.statelessComponent("Term");

open! Type.Agda.Syntax;

let make = (~value: Internal.term, _children) => {
  ...component,
  render: _self => <span> (ReasonReact.string("some term")) </span>,
};
