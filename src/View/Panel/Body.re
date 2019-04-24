[@bs.config {jsx: 3}];

open ReasonReact;

open Rebase;

type t =
  | Nothing
  | Emacs(Emacs__Body.t)
  | JSON(Type.View.JSON.rawBody);

[@react.component]
let make = (~body: t, ~hidden) => {
  let comp =
    switch (body) {
    | Nothing => null
    | JSON(_) => null
    | Emacs(data) => <Emacs__Body data />
    };
  let className =
    hidden
      ? ["agda-body", "native-key-bindings", "hidden"]
        |> String.joinWith(" ")
      : ["agda-body", "native-key-bindings"] |> String.joinWith(" ");
  <section className tabIndex=(-1)> comp </section>;
};

module Jsx2 = {
  let component = ReasonReact.statelessComponent("Body");
  let make = (~body: t, ~hidden, children) =>
    ReasonReactCompat.wrapReactForReasonReact(
      make,
      makeProps(~body, ~hidden, ()),
      children,
    );
};
