open ReasonReact;

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
let component = statelessComponent("EmacsError");

let make = (~body: string, _children) => {
  ...component,
  render: _self => {
    let parsed = parse(body);
    <ul> ...{parsed |> Array.map(value => <WarningError value />)} </ul>;
  },
};
