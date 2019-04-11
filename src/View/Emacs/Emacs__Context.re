open ReasonReact;

open Rebase;

open Emacs.Component;

let component = statelessComponent("EmacsContext");

let make = (~body: string, _children) => {
  ...component,
  render: _self => {
    let parsed = Emacs.Parser.Response.context(body);
    <> <ul> ...(parsed |> Array.map(value => <Output value />)) </ul> </>;
  },
};
