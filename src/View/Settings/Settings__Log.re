open ReasonReact;
open Rebase;

module Entry = {
  [@react.component]
  let make = (~entry: Metadata.Log.Entry.t) => {
    let (hidden, setHidden) = Hook.useState(true);
    let className = hidden ? "hidden" : "";
    let rawTexts =
      entry.response.rawText
      |> Array.map(text => <li> {string(text)} </li>)
      |> Util.React.manyIn("ol");
    let sexpressions =
      entry.response.sexpression
      |> Array.map(text =>
           <li> {string(Parser.SExpression.toString(text))} </li>
         )
      |> Util.React.manyIn("ol");
    let responses =
      entry.response.response
      |> Array.map(text => <li> {string(Response.toString(text))} </li>)
      |> Util.React.manyIn("ol");
    let hasError = Array.length(entry.response.error) > 0;
    let errors =
      entry.response.error
      |> Array.map(text => <li> {string(Parser.Error.toString(text))} </li>)
      |> Util.React.manyIn("ol");

    <li className="agda-settings-log-entry">
      <h2 onClick={_ => setHidden(!hidden)}>
        {string(Command.Remote.toString(entry.request))}
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
        {hasError ? <> <hr /> <h3> {string("error")} </h3> errors </> : null}
      </section>
    </li>;
  };
};

[@react.component]
let make = (~connection: option(Connection.t), ~hidden) => {
  let (showInstruction, setShowInstruction) = Hook.useState(false);
  let (refreshOnLoad, setRefreshOnLoad) = Hook.useState(true);
  connection
  |> Option.forEach(conn => conn.Connection.resetLogOnLoad = refreshOnLoad);

  let className =
    Util.ClassName.(
      ["agda-settings-log"] |> addWhen("hidden", hidden) |> serialize
    );

  let entries =
    connection
    |> Option.mapOr(conn => conn.Connection.metadata.entries, [||])
    |> Array.map(entry => <Entry entry />)
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
    <p>
      <label className="input-label">
        <input
          className="input-toggle"
          type_="checkbox"
          checked=refreshOnLoad
          onChange={_ => setRefreshOnLoad(!refreshOnLoad)}
        />
        {string("Refresh on Load (C-c C-l)")}
      </label>
    </p>
    <p>
      <button
        onClick={_ => {
          setShowInstruction(true);
          connection
          |> Option.forEach(conn => Metadata.dump(conn.Connection.metadata));
        }}
        className="btn btn-primary icon icon-clippy">
        {string("Dump log")}
      </button>
    </p>
    {showInstruction
       ? <p className="text-warning">
           {string(
              "In case of parse error, please copy the log and paste it ",
            )}
           <a href="https://github.com/banacorn/agda-mode/issues/new">
             {string("here")}
           </a>
         </p>
       : null}
    <hr />
    entries
  </section>;
};
