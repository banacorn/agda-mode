open ReasonReact;

open Rebase;
open Rebase.Option;

open Emacs__Component;

let parse: string => (string, array(Output.t)) =
  raw => {
    let lines = raw |> Js.String.split("\n");
    let target =
      lines[0] |> map(Js.String.sliceToEnd(~from=18)) |> getOr("???");
    let outputs =
      lines
      |> Js.Array.sliceFrom(1)
      |> Array.map(s => s |> Js.String.sliceToEnd(~from=2))
      |> Emacs__Parser.unindent
      |> Array.map(Output.parse)
      |> Array.filterMap(x => x);
    (target, outputs);
  };
let component = statelessComponent("EmacsSearchAbout");

let make = (~body: string, _children) => {
  ...component,
  render: _self => {
    let (target, outputs) = parse(body);
    Array.length(outputs) === 0
      ? <p> {string("There are no definitions about " ++ target)} </p>
      : <>
          <p> {string("Definitions about " ++ target ++ ":")} </p>
          <ul> ...{outputs |> Array.map(value => <Output value />)} </ul>
        </>;
  },
};
