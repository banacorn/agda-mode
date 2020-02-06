open ReasonReact;

[@react.component]
let make = (~error: Connection.Error.t) => {
  let (header, body) = Connection.Error.toString(error);
  <>
    <hr />
    <h2> {string("Error: " ++ header)} </h2>
    <p> {string("error message:")} </p>
    <pre className="inset-panel padded text-warning error">
      {string(body)}
    </pre>
  </>;
};