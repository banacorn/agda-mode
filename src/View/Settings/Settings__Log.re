open ReasonReact;
open Util.React;
open Rebase;

module Entry = {
  [@react.component]
  let make = (~entry: Log.Entry.t) => {
    let (hidden, setHidden) = Hook.useState(true);
    let className = hidden ? "hidden" : "";
    let rawTexts =
      entry.response.rawText
      |> Array.map(text => <li> {string(text)} </li>)
      |> React.array;
    let sexpressions =
      entry.response.sexpression
      |> Array.map(text =>
           <li> {string(Parser.SExpression.toString(text))} </li>
         )
      |> React.array;
    let responses =
      entry.response.response
      |> Array.map(text => <li> {string(Response.toString(text))} </li>)
      |> React.array;
    let hasError = Array.length(entry.response.error) > 0;
    let errors =
      entry.response.error
      |> Array.map(text => <li> {string(Parser.Error.toString(text))} </li>)
      |> React.array;

    <li className="agda-settings-log-entry">
      <h2 onClick={_ => setHidden(!hidden)}>
        {string(Request.toString(entry.request))}
      </h2>
      <section className>
        <h3> {string("raw text")} </h3>
        <ol> rawTexts </ol>
        <hr />
        <h3> {string("s-expression")} </h3>
        <ol> sexpressions </ol>
        <hr />
        <h3> {string("response")} </h3>
        <ol> responses </ol>
        {hasError
           ? <> <hr /> <h3> {string("error")} </h3> <ol> errors </ol> </>
           : null}
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

  let entries =
    connection
    |> Option.mapOr(conn => conn.Connection.log, [||])
    |> Array.map(entry => <Entry entry />)
    |> React.array;

  <section className={"agda-settings-log" ++ showWhen(!hidden)}>
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
          connection |> Option.forEach(Connection.dump);
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
    <ol> entries </ol>
  </section>;
};