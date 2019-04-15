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
      /* | Unloaded => <Emacs__Error body="not loaded yet" /> */
      | JSON(raw) =>
        switch (Decoder.parseBody(raw)) {
        | AllGoalsWarnings(value) => <JSON__AllGoalsWarnings value />
        | ErrorMessage(value, rawString) => <JSON__Error value rawString />
        | PlainText(s) => <p> {string(s)} </p>
        }
      | Emacs(data) => <Emacs__Body data />
      };
    let className =
      hidden
        ? ["agda-body", "native-key-bindings", "hidden"]
          |> String.joinWith(" ")
        : ["agda-body", "native-key-bindings"] |> String.joinWith(" ");
    <section className tabIndex=(-1)> comp </section>;
  },
};
