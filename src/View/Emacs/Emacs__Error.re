[@bs.config {jsx: 3}];

open Emacs__Component;
open Rebase.Option;
open Rebase;

let parse: string => array(WarningError.t) =
  raw => {
    let lines = raw |> Js.String.split("\n");
    lines
    |> Util.Dict.partite(((_, i)) => i === 0 ? Some("errors") : None)
    |> Emacs__Parser.partiteWarningsOrErrors("errors")
    |> Js.Dict.get(_, "errors")
    |> mapOr(
         metas =>
           metas
           |> Array.map(WarningError.parseError)
           |> Array.filterMap(x => x),
         [||],
       );
  };

[@react.component]
let make = (~body: string) => {
  parse(body)
  |> Array.map(value => <WarningError value />)
  |> Util.React.manyIn("ul");
};
