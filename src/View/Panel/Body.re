open ReasonReact;

open Rebase;

type t =
  | Nothing
  | Emacs(Emacs__Body.t)
  | JSON(Type.View.JSON.rawBody);

let component = statelessComponent("JSONBody");

let make = (~body: t, ~hidden, _children) => {
  ...component,
  render: _self => {
    let comp =
      switch (body) {
      | Nothing => null
      | JSON(_) => null
      | Emacs(data) => <Emacs__Body.Jsx2 data />
      };
    let className =
      hidden
        ? ["agda-body", "native-key-bindings", "hidden"]
          |> String.joinWith(" ")
        : ["agda-body", "native-key-bindings"] |> String.joinWith(" ");
    <section className tabIndex=(-1)> comp </section>;
  },
};
