open ReasonReact;
open Rebase;

module Log = {
  [@react.component]
  let make = (~log: Connection.Log.t) => {
    let rawText =
      log.response.rawText
      |> Array.map(text => <li> {string(text)} </li>)
      |> Util.React.manyIn("ol");

    <li className="agda-settings-log-entry">
      <h2> {string(Command.Remote.toString(log.request.command))} </h2>
      rawText
    </li>;
  };
  // <h2> {string("Request")} </h2>
  // <h2> {string("Response")} </h2>
};

[@react.component]
let make = (~connection: option(Connection.t), ~hidden) => {
  let className =
    Util.ClassName.(
      ["agda-settings-log"] |> addWhen("hidden", hidden) |> serialize
    );

  let logs =
    connection
    |> Option.mapOr(conn => conn.Connection.logs, [||])
    |> Array.map(log => <Log log />)
    |> Util.React.manyIn("ol");
  <section className>
    <h1>
      <span className="icon icon-comment-discussion" />
      <span> {string("Log")} </span>
    </h1>
    <hr />
    <p>
      {string(
         "Keeps track of what Agda said what we've parsed. \nFor reporting parse errors. \nRefreshed on reload (C-c C-l)",
       )}
    </p>
    <hr />
    logs
  </section>;
  // <div className="block">
  //   <button className="btn btn-primary icon icon-clippy">
  //     {string("Dump to clipboard")}
  //   </button>
  // </div>
  // responseListItems
};
