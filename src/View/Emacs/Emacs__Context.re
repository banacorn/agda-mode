open Rebase;

open Emacs__Component;

let parse: string => array(Output.t) =
  raw => {
    let lines = raw |> Js.String.split("\n") |> Emacs__Parser.unindent;
    lines |> Array.map(Output.parse) |> Array.filterMap(x => x);
  };

[@react.component]
let make = (~body: string) => {
  parse(body)
  |> Array.map(value => <Output value />)
  |> Util.React.manyIn("ul");
};
