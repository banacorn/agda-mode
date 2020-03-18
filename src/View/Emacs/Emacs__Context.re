open Rebase;

open Emacs__Component;

let parse: string => array(Output.t) =
  raw => {
    let lines = raw |> Js.String.split("\n") |> Emacs__Parser.unindent;
    lines |> Array.map(Output.parse) |> Array.filterMap(x => x);
  };

[@react.component]
let make = (~body: string) =>
  <ul>
    {parse(body)
     |> Array.mapi((value, i) => <Output key={string_of_int(i)} value />)
     |> React.array}
  </ul>;