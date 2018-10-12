open ReasonReact;

open EmacsComponent;

let component = ReasonReact.statelessComponent("EmacsConstraints");

let make = (~body: string, _children) => {
  ...component,
  render: _self => {
    let parsed = Emacs.Parser.constraints(body);
    <ul> ...(parsed |> Array.map(value => <Output value />)) </ul>;
  },
};
