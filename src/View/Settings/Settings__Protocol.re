open ReasonReact;
// open Rebase;

// open Type.View.Debug;

[@react.component]
let make = (~hidden) => {
  let className =
    Util.ClassName.(
      ["agda-settings-protocol"] |> addWhen("hidden", hidden) |> serialize
    );
  <section className>
    <h1>
      <span className="icon icon-comment-discussion" />
      <span> {string("Protocol")} </span>
    </h1>
    <hr />
    <p>
      {string(
         "Keeps track of what Agda said what we've parsed. \nFor reporting parse errors. \nRefreshed on reload (C-c C-l)",
       )}
    </p>
    <hr />
    <h2> <span> {string("Raw text")} </span> </h2>
    <ol> <li> <pre> {string("Raw text")} </pre> </li> </ol>
    <ol> <li> <pre> {string("Raw text")} </pre> </li> </ol>
    <hr />
    <h2> <span> {string("S-expressions")} </span> </h2>
    <ol> <li> <pre> {string("S-expressions")} </pre> </li> </ol>
    <ol> <li> <pre> {string("S-expressions")} </pre> </li> </ol>
    <hr />
    <h2> <span> {string("Responses")} </span> </h2>
    <ol> <li> <pre> {string("Responses")} </pre> </li> </ol>
    <ol> <li> <pre> {string("Responses")} </pre> </li> </ol>
  </section>;
  // <div className="block">
  //   <button className="btn" onClick={_ => ()}>
  //     {string("Dump Markers")}
  //   </button>
  // </div>
};
