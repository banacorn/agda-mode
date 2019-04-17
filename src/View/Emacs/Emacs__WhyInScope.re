open ReasonReact;

open Emacs__Component;
open Rebase.Option;

let parse: string => array(PlainText.t) =
  raw => {
    raw |> PlainText.parse |> getOr([||]);
  };
let component = statelessComponent("EmacsWhyInScope");

let make = (~body: string, _children) => {
  ...component,
  render: _self => {
    let value = parse(body);
    <p> <PlainText value /> </p>;
  },
};
