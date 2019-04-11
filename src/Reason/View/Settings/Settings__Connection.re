open ReasonReact;
open Rebase;

/*  */

type state = {
  connected: bool,
  editorRef: ref(option(Atom.TextEditor.t)),
  editorModel: ref(MiniEditor.Model.t),
};
type action =
  | AutoSearch
  | Connect(string);

let initialState = () => {
  connected: false,
  editorRef: ref(None),
  editorModel: ref(MiniEditor.Model.make()),
};
let reducer = (onInquireConnection, action: action, state: state) =>
  switch (action) {
  | AutoSearch =>
    SideEffects(
      _ => onInquireConnection |> Event.emitOk(Connection.AutoSearch),
    )
  | Connect(path) =>
    SideEffects(
      _ => onInquireConnection |> Event.emitOk(Connection.Connect(path)),
    )
  };

let component = reducerComponent("Connection");

let setEditorRef = (theRef, {ReasonReact.state}) => {
  state.editorRef := Some(theRef);
};

let make =
    (
      ~inquireConnection: Event.t(unit, unit),
      ~onInquireConnection: Event.t(Connection.viewAction, MiniEditor.error),
      ~connection: option(Connection.t),
      ~error: option(Connection.error),
      ~hidden,
      _children,
    ) => {
  ...component,
  initialState,
  reducer: reducer(onInquireConnection),
  didMount: self => {
    open Event;
    /* pipe `editorModel` to `onInquireConnection` */
    self.state.editorModel^.result
    |> pipeMap(onInquireConnection, x => Connection.Connect(x))
    |> destroyWhen(self.onUnmount);
    /* listens to `inquireConnection` */
    inquireConnection
    |> onOk(() =>
         Webapi.Dom.(
           self.state.editorRef^
           |> Option.forEach(editor => {
                editor |> Atom.Environment.Views.getView |> HtmlElement.focus;
                editor |> Atom.TextEditor.selectAll;
              })
         )
       )
    |> destroyWhen(self.onUnmount);
  },
  render: self => {
    let connected = connection |> Option.isSome;
    let className =
      Util.ClassName.(
        ["agda-settings-connection"]
        |> addWhen("hidden", hidden)
        |> addWhen("inquiring", !connected)
        |> serialize
      );
    let status =
      connected ?
        <span
          title="connected"
          id="connection-status"
          className="icon icon-primitive-dot text-success"
        /> :
        <span
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
          editorRef={self.handle(setEditorRef)}
          onConfirm={result => self.send(Connect(result))}
          onCancel={(.) => ()}
        />
      </p>
      <p>
        <button
          className="btn icon icon-search inline-block-tight"
          onClick={_ => self.send(AutoSearch)}>
          {string("auto search")}
        </button>
      </p>
      {switch (error) {
       | None => null
       | Some(err) => <Settings__Connection__Error error=err />
       }}
    </section>;
  },
};
