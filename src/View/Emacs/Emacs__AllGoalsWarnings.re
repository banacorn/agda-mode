[@bs.config {jsx: 3}];

open Emacs__Component;

type t = {
  title: string,
  interactionMetas: array(Output.t),
  hiddenMetas: array(Output.t),
  warnings: array(WarningError.t),
  errors: array(WarningError.t),
};
let parse = (title, body): t => {
  open Rebase;
  open Rebase.Option;
  let partiteAllGoalsWarnings: (string, string) => Js.Dict.t(array(string)) =
    (title, body) => {
      let lines = body |> Js.String.split("\n");
      /* examine the header to see what's in the body */
      let hasMetas = title |> Js.String.match([%re "/Goals/"]) |> isSome;
      let hasWarnings =
        title |> Js.String.match([%re "/Warnings/"]) |> isSome;
      let hasErrors = title |> Js.String.match([%re "/Errors/"]) |> isSome;
      /* predicates for partitioning the body */
      let markMetas = ((_, i)) =>
        hasMetas && i === 0 ? Some("metas") : None;
      let markWarnings = ((line, i)) =>
        hasWarnings
          ? hasMetas
              /* Has both warnings and metas */
              ? line
                |> Js.String.slice(~from=5, ~to_=13)
                |> Js.String.match([%re "/Warnings/"])
                |> map(_ => "warnings")
              /* Has only warnings */
              : i === 0 ? Some("warnings") : None
          /* Has no warnings */
          : None;
      let markErrors = ((line, i)) =>
        hasErrors
          /* Has both warnings or metas and errors */
          ? hasMetas || hasWarnings
              ? line
                |> Js.String.slice(~from=5, ~to_=11)
                |> Js.String.match([%re "/Errors/"])
                |> map(_ => "errors")
              /* Has only errors */
              : i === 0 ? Some("errors") : None
          : None;
      lines
      |> Util.Dict.partite(line =>
           or_(or_(markMetas(line), markWarnings(line)), markErrors(line))
         );
    };
  let dictionary: Js.Dict.t(array(string)) =
    partiteAllGoalsWarnings(title, body)
    |> Emacs__Parser.partiteMetas
    |> Emacs__Parser.partiteWarningsOrErrors("warnings")
    |> Emacs__Parser.partiteWarningsOrErrors("errors");
  /* extract entries from the dictionary */
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
  let warnings =
    "warnings"
    |> Js.Dict.get(dictionary)
    |> mapOr(
         entries =>
           entries
           |> Array.map(WarningError.parseWarning)
           |> Array.filterMap(x => x),
         [||],
       );
  let errors =
    "errors"
    |> Js.Dict.get(dictionary)
    |> mapOr(
         entries =>
           entries
           |> Array.map(WarningError.parseError)
           |> Array.filterMap(x => x),
         [||],
       );
  {title, interactionMetas, hiddenMetas, warnings, errors};
};

[@react.component]
let make = (~value: t) => {
  let {interactionMetas, hiddenMetas, warnings, errors} = value;
  <>
    {interactionMetas
     |> Array.map(value => <Output value />)
     |> Util.React.manyIn("ul")}
    {hiddenMetas
     |> Array.map(value => <Output value />)
     |> Util.React.manyIn("ul")}
    {warnings
     |> Array.map(value => <WarningError value />)
     |> Util.React.manyIn("ul")}
    {errors
     |> Array.map(value => <WarningError value />)
     |> Util.React.manyIn("ul")}
  </>;
};
