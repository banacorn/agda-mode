open ReasonReact;

let component = ReasonReact.statelessComponent("Comparison");

let make = (~cmp: Type.TypeChecking.comparison, _children) => {
  ...component,
  render: _self =>
    switch (cmp) {
    | CmpLeq => <span> (string({js| ≤ |js})) </span>
    | CmpEq => <span> (string({js| = |js})) </span>
    },
};
