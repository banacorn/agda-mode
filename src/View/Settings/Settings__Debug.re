open ReasonReact;
open Rebase;

[@react.component]
let make = (~hidden) => {
  let className =
    Util.ClassName.(
      ["agda-settings-debug"] |> addWhen("hidden", hidden) |> serialize
    );
  <section className>
    <h1>
      <span className="icon icon-terminal" />
      <span> {string("Debug")} </span>
    </h1>
    <hr />
    <h2> {string("Input Method")} </h2>
  </section>;
};
