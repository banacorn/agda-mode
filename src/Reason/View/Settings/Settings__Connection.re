open ReasonReact;
open Rebase;

/*  */

type state = {
  connected: bool,
  editorRef: ref(option(Atom.TextEditor.t)),
  editorModel: ref(MiniEditor.Model.t),
  message: string,
  value: string,
};
type action =
  | Inquire(string, string)
  | Connect
  | Disconnect;

let initialState = () => {
  connected: false,
  editorRef: ref(None),
  editorModel: ref(MiniEditor.Model.make()),
  message: "",
  value: "",
};
let reducer = (action: action, state: state) =>
  switch (action) {
  | Inquire(message, value) =>
    UpdateWithSideEffects(
      {...state, message, value},
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
      ~inquireConnection: Util.Event.t((string, string)),
      ~onInquireConnection: Util.Event.t(string),
      ~connection: option(Connection.t),
      ~hidden,
      _children,
    ) => {
  ...component,
  initialState,
  reducer,
  didMount: self => {
    Util.Event.(
      inquireConnection
      |> on(((message, value)) => {
           self.send(Inquire(message, value));
           /* onInquireConnection */
           let promise = self.state.editorModel^ |> MiniEditor.Model.inquire;
           onInquireConnection |> handlePromise(promise);
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
    let {message, value} = self.state;

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
              {String.isEmpty(message) || connected ?
                 null :
                 <pre className="inset-panel padded text-warning error">
                   {string(message)}
                 </pre>}
            </div>
          </li>
        </ul>
      </form>
    </section>;
  },
};
