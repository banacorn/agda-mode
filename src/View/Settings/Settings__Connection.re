open ReasonReact;
open Rebase;

[@react.component]
let make =
    (
      ~inquireConnection: Event.t(unit, unit),
      ~onInquireConnection: Event.t(string, MiniEditor.error),
      ~connection: option(Connection.t),
      ~error: option(Connection.Error.t),
      ~hidden,
    ) => {
  let (autoSearchError, setAutoSearchError) = Hook.useState(None);
  let (_, setConnectPath) = Hook.useState("");
  let (editorRef, setEditorRef) = Hook.useState(None);

  /* triggering autoSearch */
  let handleAutoSearch = _ => {
    Connection.autoSearch("agda")
    |> Async.thenOk(path =>
         (
           switch (editorRef) {
           | None => ()
           | Some(editor) => editor |> Atom.TextEditor.setText(path)
           }
         )
         |> Async.resolve
       )
    |> Async.finalError(err =>
         setAutoSearchError(Some(Connection.Error.AutoSearchError(err)))
       );
  };

  /* triggering connect */
  let handleConnect = path => {
    setConnectPath(path);
    setAutoSearchError(None);
    onInquireConnection |> Event.emitOk(path);
  };

  /* pipe `editorModel` to `onInquireConnection` */
  React.useEffect1(
    () => {
      open Event;
      let editorModel = MiniEditor.Model.make();
      let destructor = editorModel.result |> pipe(onInquireConnection);
      Some(destructor);
    },
    [||],
  );
  /* listens to `inquireConnection` */
  React.useEffect1(
    () => {
      open Event;
      open Webapi.Dom;
      let destructor =
        inquireConnection
        |> onOk(() =>
             editorRef
             |> Option.forEach(editor => {
                  editor |> Atom.Environment.Views.getView |> HtmlElement.focus;
                  editor |> Atom.TextEditor.selectAll;
                })
           );
      Some(destructor);
    },
    [||],
  );

  let connected = connection |> Option.isSome;
  let className =
    Util.ClassName.(
      ["agda-settings-connection"]
      |> addWhen("hidden", hidden)
      |> addWhen("inquiring", !connected)
      |> serialize
    );
  let status =
    connected
      ? <span
          title="connected"
          id="connection-status"
          className="icon icon-primitive-dot text-success"
        />
      : <span
          title="disconnected"
          id="connection-status"
          className="icon icon-primitive-dot text-error"
        />;
  <section className>
    <h1>
      <span className="icon icon-plug" />
      <span> {string("Connection to Agda")} </span>
      status
    </h1>
    <hr />
    <h2> {string("Status")} </h2>
    {switch (connection) {
     | None => <> <p> {string("connection not established")} </p> </>
     | Some(conn) =>
       <>
         <p> {string("Path: " ++ conn.metadata.path)} </p>
         <p> {string("Version: " ++ conn.metadata.version)} </p>
         <p>
           {string(
              "Supported protocol: "
              ++ (
                switch (conn.metadata.protocol) {
                | Connection.EmacsOnly => "Emacs"
                | Connection.EmacsAndJSON => "Emacs / JSON"
                }
              ),
            )}
         </p>
       </>
     }}
    <hr />
    <h2> {string("Path")} </h2>
    <p>
      <MiniEditor
        hidden=false
        value={
          switch (connection) {
          | None => ""
          | Some(conn) => conn.metadata.path
          }
        }
        placeholder="path to Agda"
        onEditorRef={ref => setEditorRef(Some(ref))}
        onConfirm=handleConnect
      />
    </p>
    <p>
      <button
        className="btn icon icon-search inline-block-tight"
        onClick=handleAutoSearch>
        {string("auto search")}
      </button>
    </p>
    {switch (autoSearchError) {
     | None =>
       switch (error) {
       | None => null
       | Some(err) => <Settings__Connection__Error error=err />
       }
     | Some(err) => <Settings__Connection__Error error=err />
     }}
  </section>;
};
