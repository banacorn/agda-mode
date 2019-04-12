open ReasonReact;

open Connection;

let component = statelessComponent("SettingsConnectionError");

let make = (~error: Error.t, _children) => {
  ...component,
  render: _self => {
    let (header, body) = Error.toString(error);
    <>
      <hr />
      <h2> {string("Error: " ++ header)} </h2>
      <p> {string("error message:")} </p>
      <pre className="inset-panel padded text-warning error">
        {string(body)}
      </pre>
    </>;
  },
};
