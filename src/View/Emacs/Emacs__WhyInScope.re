

open Emacs__Component;
open Rebase.Option;

let parse: string => array(PlainText.t) =
  raw => {
    raw |> PlainText.parse |> getOr([||]);
  };

[@react.component]
let make = (~body: string) => {
  let value = parse(body);
  <p> <PlainText value /> </p>;
};
