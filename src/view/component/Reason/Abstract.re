open ReasonReact;

open Util;

open Type.Syntax.A;

module Name = {
  let component = statelessComponent("Name");
  let make = (~value, children) => {
    ...component,
    render: _self => <C.Name value=value.concrete />,
  };
};

module QName = {
  let component = statelessComponent("QName");
  let make = (~value, children) => {
    ...component,
    render: _self => {
      let QName(xs, x) = value;
      List.append(xs, [x])
      |> List.map(n => <Name value=n />)
      |> sepBy(string("."));
    },
  };
};
