open ReasonReact;
open Rebase;

module Log = {
  [@react.component]
  let make = (~log: Connection.Log.t) => {
    let (hidden, setHidden) = Hook.useState(true);
    let className = hidden ? "hidden" : "";
    let rawTexts =
      log.response.rawText
      |> Array.map(text => <li> {string(text)} </li>)
      |> Util.React.manyIn("ol");
    let sexpressions =
      log.response.sexpression
      |> Array.map(text =>
           <li> {string(Parser.SExpression.toString(text))} </li>
         )
      |> Util.React.manyIn("ol");
    let responses =
      log.response.response
      |> Array.map(text => <li> {string(Response.toString(text))} </li>)
      |> Util.React.manyIn("ol");

    <li className="agda-settings-log-entry">
      <h2 onClick={_ => setHidden(!hidden)}>
        {string(Command.Remote.toString(log.request.command))}
      </h2>
      <section className>
        <h3> {string("raw text")} </h3>
        rawTexts
        <hr />
        <h3> {string("s-expression")} </h3>
        sexpressions
        <hr />
        <h3> {string("response")} </h3>
        responses
      </section>
    </li>;
  };
  // <h2> {string("Request")} </h2>
  // <h2> {string("Response")} </h2>
};

[@react.component]
let make = (~connection: option(Connection.t), ~hidden) => {
  let (refreshOnLoad, setRefreshOnLoad) = Hook.useState(true);
  connection
  |> Option.forEach(conn => conn.Connection.resetLogOnLoad = refreshOnLoad);

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
         "Keeps track of what Agda said what we've parsed. For reporting parse errors. ",
       )}
    </p>
    <label className="input-label">
      <input
        className="input-toggle"
        type_="checkbox"
        checked=refreshOnLoad
        onClick={_ => setRefreshOnLoad(!refreshOnLoad)}
      />
      {string("Refresh on Load (C-c C-l)")}
    </label>
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
