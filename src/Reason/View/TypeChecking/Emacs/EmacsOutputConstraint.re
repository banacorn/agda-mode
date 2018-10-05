open ReasonReact;

open Type.Interaction.Emacs;

let component = ReasonReact.statelessComponent("EmacsOutputConstraint");

let make = (~value: outputConstraint, _children) => {
  ...component,
  render: _self =>
    switch (value) {
    | OfType(e, t) =>
      <li> <EmacsExpr expr=e /> (string(" : ")) <EmacsExpr expr=t /> </li>
    | JustType(e) => <li> (string("Type ")) <EmacsExpr expr=e /> </li>
    | JustSort(e) => <li> (string("Sort ")) <EmacsExpr expr=e /> </li>
    | Others(e) => <li> <EmacsExpr expr=e /> </li>
    },
};
