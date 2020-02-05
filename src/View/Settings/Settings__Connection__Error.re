open ReasonReact;

open Connection;

[@react.component]
let make = (~error: Connection2.Error.t) => {
  let (header, body) = Connection2.Error.toString(error);
  <>
    <hr />
    <h2> {string("Error: " ++ header)} </h2>
    <p> {string("error message:")} </p>
    <pre className="inset-panel padded text-warning error">
      {string(body)}
    </pre>
  </>;
};