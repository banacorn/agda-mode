open ReasonReact;
open Rebase;

/*  */

type state = {
  connected: bool,
  editorRef: ref(option(Atom.TextEditor.t)),
  editorModel: ref(MiniEditor.Model.t),
  autoSearch: option(Connection.Error.t),
};
type action =
  | UpdateError(option(Connection.Error.t))
  | AutoSearch
  | Connect(string);

let initialState = () => {
  connected: false,
  editorRef: ref(None),
  editorModel: ref(MiniEditor.Model.make()),
  autoSearch: None,
};
let reducer = (onInquireConnection, action: action, state: state) =>
  switch (action) {
  | UpdateError(autoSearch) => Update({...state, autoSearch})
  | AutoSearch =>
    SideEffects(
      self =>
        Connection.autoSearch("agda")
        |> Async.thenOk(path =>
             (
               switch (self.state.editorRef^) {
               | None => ()
               | Some(editor) => editor |> Atom.TextEditor.setText(path)
               }
             )
             |> Async.resolve
           )
        |> Async.finalError(err =>
             self.send(UpdateError(Some(AutoSearchError(err))))
           ),
    )
  | Connect(path) =>
    UpdateWithSideEffects(
      {...state, autoSearch: None},
      _ => onInquireConnection |> Event.emitOk(path),
    )
  };

let component = reducerComponent("Connection");

let setEditorRef = (theRef, {ReasonReact.state}) => {
  state.editorRef := Some(theRef);
};

let make =
    (
      ~inquireConnection: Event.t(unit, unit),
      ~onInquireConnection: Event.t(string, MiniEditor.error),
      ~connection: option(Connection.t),
      ~error: option(Connection.Error.t),
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
    |> pipe(onInquireConnection)
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
      {switch (self.state.autoSearch) {
       | None =>
         switch (error) {
         | None => null
         | Some(err) => <Settings__Connection__Error error=err />
         }
       | Some(err) => <Settings__Connection__Error error=err />
       }}
    </section>;
  },
};
