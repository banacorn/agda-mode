open ReasonReact;

[@react.component]
let make = (~hidden) => {
  let className =
    Util.ClassName.(
      ["agda-settings-placeholder"] |> addWhen("hidden", hidden) |> serialize
    );
  <section className>
    <h1> <span> {string("Coming soon")} </span> </h1>
  </section>;
};
