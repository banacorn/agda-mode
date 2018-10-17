open ReasonReact;

open Emacs.Component;

let component = statelessComponent("EmacsError");

let make = (~body: string, _children) => {
  ...component,
  render: _self => {
    let parsed = Emacs.Parser.Response.error(body);
    <ul> ...(parsed |> Array.map(value => <WarningError value />)) </ul>;
  },
};
