open ReasonReact;

open Rebase;
open Rebase.Option;

open Emacs__Component;

type t = {
  goal: option(Expr.t),
  have: option(Expr.t),
  interactionMetas: array(Output.t),
  hiddenMetas: array(Output.t),
};
let parse = raw => {
  let markGoal = ((line, _)) =>
    line |> Js.String.match([%re "/^Goal:/"]) |> map(_ => "goal");
  let markHave = ((line, _)) =>
    line |> Js.String.match([%re "/^Have:/"]) |> map(_ => "have");
  let markMetas = ((line, _)) =>
    line |> Js.String.match([%re "/\\u2014{60}/g"]) |> map(_ => "metas");
  let partiteGoalTypeContext =
    Util.Dict.partite(line =>
      or_(or_(markGoal(line), markHave(line)), markMetas(line))
    );
  let removeDelimeter = Util.Dict.update("metas", Js.Array.sliceFrom(1));
  let lines = raw |> Js.String.split("\n");
  let dictionary =
    lines
    |> partiteGoalTypeContext
    |> removeDelimeter
    |> Emacs__Parser.partiteMetas;
  /* extract entries from the dictionary */
  let goal =
    "goal"
    |> Js.Dict.get(dictionary)
    |> flatMap(line =>
         line
         |> List.fromArray
         |> String.joinWith("\n")
         |> Js.String.sliceToEnd(~from=5)
         |> Expr.parse
       );
  let have =
    "have"
    |> Js.Dict.get(dictionary)
    |> flatMap(line =>
         line
         |> List.fromArray
         |> String.joinWith("\n")
         |> Js.String.sliceToEnd(~from=5)
         |> Expr.parse
       );
  let interactionMetas =
    "interactionMetas"
    |> Js.Dict.get(dictionary)
    |> mapOr(
         metas =>
           metas
           |> Array.map(Output.parseOutputWithoutRange)
           |> Array.filterMap(x => x),
         [||],
       );
  let hiddenMetas =
    "hiddenMetas"
    |> Js.Dict.get(dictionary)
    |> mapOr(
         metas =>
           metas
           |> Array.map(Output.parseOutputWithRange)
           |> Array.filterMap(x => x),
         [||],
       );
  {goal, have, interactionMetas, hiddenMetas};
};

[@react.component]
let make = (~body: string) => {
  let parsed = parse(body);
  <>
    <ul>
      {parsed.goal
       |> Option.mapOr(expr => <Labeled label="Goal " expr />, null)}
      {parsed.have
       |> Option.mapOr(expr => <Labeled label="Have " expr />, null)}
    </ul>
    {<ul>
       {parsed.interactionMetas
        |> Array.mapi((value, i) => <Output key={string_of_int(i)} value />)
        |> React.array}
     </ul>}
    {<ul>
       {parsed.hiddenMetas
        |> Array.mapi((value, i) => <Output key={string_of_int(i)} value />)
        |> React.array}
     </ul>}
  </>;
};