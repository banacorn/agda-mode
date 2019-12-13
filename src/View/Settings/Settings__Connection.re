open ReasonReact;
open Rebase;
open Async;
open Util.React;

[@react.component]
let make =
    (
      ~connection: option(Connection.t),
      ~error: option(Connection.Error.t),
      ~hidden,
    ) => {
  let channels = React.useContext(Channels.context);
  let (autoSearchError, setAutoSearchError) = Hook.useState(None);
  let editorRef = Resource.make();
  let onSetPath = Event.make();

  /* triggering autoSearch */
  let handleAutoSearch = _ => {
    Connection.autoSearch("agda")
    |> thenOk(path =>
         editorRef.acquire()
         |> thenOk(editor => {
              editor |> Atom.TextEditor.setText(path);
              resolve();
            })
       )
    // report error when autoSearch failed
    |> finalError(err => setAutoSearchError(Some(err)));
  };

  let focusOnPathEditor = editor => {
    editor |> Atom.Views.getView |> Webapi.Dom.HtmlElement.focus;
    editor |> Atom.TextEditor.selectAll |> ignore;
    onSetPath |> Event.once;
  };

  // focus on the path editor on `inquireConnection`
  Hook.useChannel(
    () => editorRef.acquire() |> thenOk(focusOnPathEditor),
    channels.inquireConnection,
  );

  let connected = connection |> Option.isSome;
  let className =
    "agda-settings-connection"
    ++ showWhen(!hidden)
    ++ when_(!connected, "inquiring");
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
              ++ Metadata.Protocol.toString(conn.metadata.protocol),
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
        onEditorRef={editorRef.supply}
        onConfirm={path => {
          setAutoSearchError(None);
          onSetPath |> Event.emitOk(path);
        }}
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
