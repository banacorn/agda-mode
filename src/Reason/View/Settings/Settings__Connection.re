open ReasonReact;
open Rebase;

/*  */

type state = {
  connected: bool,
  editorRef: ref(option(Atom.TextEditor.t)),
  editorModel: ref(MiniEditor.Model.t),
  error: option(Connection.error),
  value: string,
};
type action =
  | Inquire(option(Connection.error), string)
  | Connect
  | Disconnect;

let initialState = () => {
  connected: false,
  editorRef: ref(None),
  editorModel: ref(MiniEditor.Model.make()),
  error: None,
  value: "",
};
let reducer = (action: action, state: state) =>
  switch (action) {
  | Inquire(error, value) =>
    UpdateWithSideEffects(
      {...state, error, value},
      _self =>
        Webapi.Dom.(
          state.editorRef^
          |> Option.forEach(editor => {
               editor |> Atom.Environment.Views.getView |> HtmlElement.focus;
               editor |> Atom.TextEditor.selectAll;
             })
        ),
    )
  | Connect => NoUpdate
  | Disconnect => NoUpdate
  };

let component = reducerComponent("Connection");

let setEditorRef = (theRef, {ReasonReact.state}) => {
  state.editorRef := Some(theRef);
};

let make =
    (
      ~inquireConnection: Event.t((option(Connection.error), string), unit),
      ~onInquireConnection: Event.t(string, MiniEditor.error),
      ~connection: option(Connection.t),
      ~hidden,
      _children,
    ) => {
  ...component,
  initialState,
  reducer,
  didMount: self => {
    Event.(
      inquireConnection
      |> onOk(((error, value)) => {
           self.send(Inquire(error, value));
           /* onInquireConnection */
           self.state.editorModel^
           |> MiniEditor.Model.inquire
           |> Async.finalOk(value =>
                onInquireConnection |> Event.resolve(value)
              );
         })
      |> destroyWhen(self.onUnmount)
    );
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
    let {error, value} = self.state;

    <section className>
      <form>
        <ul className="agda-settings-connection-dashboard">
          <li id="agda-settings-connection-agda">
            <h2>
              <label className="input-label">
                <span> {string("Connection to Agda")} </span>
                <input
                  className="input-toggle"
                  checked=connected
                  type_="checkbox"
                  onChange={_ => ()}
                />
              </label>
            </h2>
            <div>
              {switch (connection) {
               | None =>
                 <>
                   <p> {string("Connection: not established")} </p>
                   <p> {string("Path: unknown")} </p>
                   <p> {string("Version: unknown")} </p>
                   <p> {string("Supported protocol: unknown")} </p>
                 </>
               | Some(conn) =>
                 <>
                   <p> {string("Connection: established")} </p>
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
              <p>
                <MiniEditor
                  hidden=false
                  value
                  placeholder="path to Agda"
                  editorRef={self.handle(setEditorRef)}
                  onConfirm={result =>
                    self.state.editorModel^ |> MiniEditor.Model.answer(result)
                  }
                  onCancel={(.) => ()}
                />
              </p>
              <p>
                <button
                  className="btn icon icon-search inline-block-tight"
                  onClick={_ => ()}>
                  {string("auto search")}
                </button>
              </p>
              {connected ? null : <Settings__Connection__Error error />}
            </div>
          </li>
        </ul>
      </form>
    </section>;
  },
};
