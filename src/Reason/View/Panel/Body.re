open ReasonReact;

open Rebase;

open Type.View;

let component = statelessComponent("JSONBody");

let make = (~body: body, ~maxHeight: int, ~hidden, ~mountAtBottom, _children) => {
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
      | Emacs(data) =>
        switch (data) {
        | AllGoalsWarnings(value) => <Emacs__AllGoalsWarnings value />
        | GoalTypeContext(body) => <Emacs__GoalTypeContext body />
        | Context(body) => <Emacs__Context body />
        | Constraints(body) => <Emacs__Context body />
        | WhyInScope(body) => <Emacs__WhyInScope body />
        | SearchAbout(body) => <Emacs__SearchAbout body />
        | Error(body) => <Emacs__Error body />
        | PlainText(body) =>
          String.isEmpty(body) ? null : <p> {string(body)} </p>
        }
      };
    let className =
      hidden ?
        ["agda-body", "native-key-bindings", "hidden"]
        |> String.joinWith(" ") :
        ["agda-body", "native-key-bindings"] |> String.joinWith(" ");
    let style =
      mountAtBottom ?
        Some(
          ReactDOMRe.Style.make(
            ~maxHeight=string_of_int(maxHeight) ++ "px",
            (),
          ),
        ) :
        None;
    <section className ?style tabIndex=(-1)> comp </section>;
  },
};
