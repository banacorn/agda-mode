[@bs.config {jsx: 3}]
open ReasonReact;

open Connection;

[@react.component]
let make = (~error: Error.t) => {
  let (header, body) = Error.toString(error);
  <>
    <hr />
    <h2> {string("Error: " ++ header)} </h2>
    <p> {string("error message:")} </p>
    <pre className="inset-panel padded text-warning error">
      {string(body)}
    </pre>
  </>;
};

module Jsx2 = {
  let component =
    ReasonReact.statelessComponent("Settings__Connection__Error");

  let make = (~error, children) =>
    ReasonReactCompat.wrapReactForReasonReact(
      make,
      makeProps(~error, ()),
      children,
    );
};
