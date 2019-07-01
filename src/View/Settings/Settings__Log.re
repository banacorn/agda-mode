open ReasonReact;

[@react.component]
let make = (~connection: option(Connection.t), ~hidden) => {
  let className =
    Util.ClassName.(
      ["agda-settings-log"] |> addWhen("hidden", hidden) |> serialize
    );
  let log =
    switch (connection) {
    | None => Connection.Log.empty
    | Some(conn) => conn.log
    };
  let rawTextListItems =
    log.rawText
    |> Array.map(raw => <li> <pre> {string(raw)} </pre> </li>)
    |> Util.React.manyIn("ol");

  let sexpressionListItems =
    log.sexpression
    |> Array.map(raw =>
         <li> <pre> {string(Parser.SExpression.toString(raw))} </pre> </li>
       )
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
    <h2> <span> {string("Raw text")} </span> </h2>
    rawTextListItems
    <hr />
    <h2> <span> {string("S-expressions")} </span> </h2>
    sexpressionListItems
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
