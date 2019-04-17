open ReasonReact;

open Rebase;

open Emacs__Component;

let parse: string => array(Output.t) =
  raw => {
    let lines = raw |> Js.String.split("\n") |> Emacs__Parser.unindent;
    lines |> Array.map(Output.parse) |> Array.filterMap(x => x);
  };
let component = statelessComponent("EmacsContext");

let make = (~body: string, _children) => {
  ...component,
  render: _self => {
    let parsed = parse(body);
    <> <ul> ...{parsed |> Array.map(value => <Output value />)} </ul> </>;
  },
};
