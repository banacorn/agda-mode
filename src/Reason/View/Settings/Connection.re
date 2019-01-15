open ReasonReact;

open Rebase;

open Type.Interaction;

type state = {connected: bool};
type action =
  | Connect
  | Disconnect;

let initialState = () => {connected: false};
let reducer = (action: action, state: state) =>
  switch (action) {
  | Connect => NoUpdate
  | Disconnect => NoUpdate
  };

let component = reducerComponent("Connection");

let make =
    (
      ~editors,
      ~onConnectionEditorRef,
      ~hidden,
      ~querying,
      ~checked,
      ~toggleAgdaConnection,
      ~agdaConnected,
      ~agdaPath,
      ~agdaVersion,
      ~supportedProtocol,
      _children,
    ) => {
  ...component,
  initialState,
  reducer,
  render: _self => {
    let className =
      Util.ClassName.(
        ["agda-settings-connection"]
        |> addWhen("hidden", hidden)
        |> addWhen("querying", querying)
        |> serialize
      );

    <section className>
      <form>
        <ul className="agda-settings-connection-dashboard">
          <li id="agda-settings-connection-agda">
            <h2>
              <label className="input-label">
                <span> {string("Connection to Agda")} </span>
                <input
                  className="input-toggle"
                  checked
                  type_="checkbox"
                  onChange=toggleAgdaConnection
                />
              </label>
            </h2>
            <div>
              <p>
                {string(
                   "Connection: "
                   ++ (agdaConnected ? "established" : "not established"),
                 )}
              </p>
              <p>
                {string(
                   "Established path: "
                   ++ (agdaConnected ? agdaPath : "unknown"),
                 )}
              </p>
              <p>
                {string(
                   "Established path: "
                   ++ (agdaConnected ? agdaVersion : "unknown"),
                 )}
              </p>
              <p> {string("Supported protocol: " ++ supportedProtocol)} </p>
              <p>
                <MiniEditor
                  hidden=false
                  value={Atom.Environment.Config.get("agda-mode.agdaPath")}
                  placeholder="path to Agda"
                  editorRef=onConnectionEditorRef
                  onFocus={(.) => ()} /* this.props.core.view.editors.setFocus('connection'); */
                  onBlur={(.) => ()} /* this.props.core.view.editors.setFocus('main'); */
                  onConfirm={result => {
                    Atom.Environment.Config.set("agda-mode.agdaPath", result);
                    editors->Editors.Connection.answer(result);
                    /* atom.config.set('agda-mode.agdaPath', result);
                       if (!querying) {
                           this.reconnectAgda();
                       }
                       */
                    ();
                  }}
                  /* this.props.core.view.editors.rejectConnection();
                     this.props.core.view.editors.focusMain(); */
                  onCancel={(.) => ()}
                />
              </p>
            </div>
          </li>
        </ul>
      </form>
    </section>;
  },
};
