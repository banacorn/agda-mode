open ReasonReact;

open Emacs__Component;
open Rebase;
open Rebase.Option;

let parse: string => (array(PlainText.t), array(Type.Location.Range.t)) =
  raw => {
    let ranges =
      raw
      |> Util.safeSplitByRe(
           [%re
             "/its definition at (\\S+\\:(?:\\d+\\,\\d+\\-\\d+\\,\\d+|\\d+\\,\\d+\\-\\d+))/g"
           ],
         )
      |> Array.mapi((token, i) =>
           switch (i mod 2) {
           | 1 => token |> flatMap(Type.Location.Range.parse)
           | _ => None
           }
         )
      |> Array.filterMap(x => x);
    (raw |> PlainText.parse |> getOr([||]), ranges);
  };
let component = statelessComponent("EmacsWhyInScope");

let make = (~body: string, _children) => {
  ...component,
  render: _self => {
    let (value, _) = parse(body);
    <p> <PlainText value /> </p>;
  },
};
