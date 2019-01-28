open ReasonReact;
open Rebase;

/*  */

type state = {
  connected: bool,
  editorRef: ref(option(Atom.TextEditor.t)),
  editorModel: ref(MiniEditor.Model.t),
  message: string,
};
type action =
  | Inquire(string, string)
  | Search
  /* | ValidatePath(string)
     | DisplayError(string) */
  | Connect
  | Disconnect;

/* let displayMessage = (self, error) => {
     error
     |> Connection.handleValidationError(
          fun
          /* the path is empty */
          | PathMalformed(msg) =>
            self.send(DisplayError("Path malformed: " ++ msg))
          /* the process is not responding */
          | ProcessHanging =>
            self.send(DisplayError("The given process is not responding"))
          /* from the shell */
          | NotFound(err) => ()
          | ShellError(err) => ()
          /* from its stderr */
          | ProcessError(string) => ()
          | IsNotAgda(string) => (),
        );
   }; */

let initialState = () => {
  connected: false,
  editorRef: ref(None),
  editorModel: ref(MiniEditor.Model.make()),
  message: "",
};
let reducer = (action: action, state: state) =>
  switch (action) {
  | Inquire(message, value) =>
    UpdateWithSideEffects(
      {...state, message},
      _self =>
        Webapi.Dom.(
          state.editorRef^
          |> Option.forEach(editor => {
               editor |> Atom.Environment.Views.getView |> HtmlElement.focus;
               editor |> Atom.TextEditor.selectAll;
             })
        ),
    )
  | Search => SideEffects(self => ())
  /* | ValidatePath(path) => */
  /* SideEffects(
       self =>
         Js.Promise.(
           Connection.validateAndMake(path)
           |> then_(x => editor |> MiniEditor.Model.answer(x) |> resolve)
           |> catch(error => {
                displayMessage(self, error);
                editor |> MiniEditor.Model.focus;
                editor |> MiniEditor.Model.select;
                resolve();
              })
           |> ignore
         ),
     ) */
  /* | DisplayError(message) => Update({...state, message}) */
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
      /* ~onMetadataMade: Connection.metadata => unit, */
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
    let className =
      Util.ClassName.(
        ["agda-settings-connection"]
        |> addWhen("hidden", hidden)
        |> addWhen("querying", querying)
        |> serialize
      );
    let {message} = self.state;

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
                  value=""
                  placeholder="path to Agda"
                  editorRef={self.handle(setEditorRef)}
                  onConfirm={result =>
                    self.state.editorModel^ |> MiniEditor.Model.answer(result)
                  }
                  /* Js.Promise.(
                       Connection.validateAndMake(result)
                       |> then_(Connection.connect)
                       |> then_(Connection.wire)
                       |> then_((conn: Connection.t) => {
                            Js.log(conn);
                            switch (conn.connection) {
                            | None => ()
                            | Some(connection) =>
                              connection.stdin
                              |> Connection.Stream.Writable.write(
                                   {j|IOTCM "/Users/banacorn/agda/test/A.agda" NonInteractive Direct ( Cmd_load "/Users/banacorn/agda/test/A.agda" [])\n|j}
                                   |> Node.Buffer.fromString,
                                 )
                              |> ignore
                            };
                            resolve((): unit);
                          })
                       |> catch(err => Js.log(err) |> resolve)
                     )
                     |> ignore; */
                  /* atom.config.set('agda-mode.agdaPath', result);
                     if (!querying) {
                         this.reconnectAgda();
                     }
                     */
                  /* this.props.core.view.editors.rejectConnection();
                     this.props.core.view.editors.focusMain(); */
                  onCancel={(.) => ()}
                />
              </p>
              <p>
                <button
                  className="btn icon icon-search inline-block-tight"
                  onClick={_ => self.send(Search)}>
                  {string("auto search")}
                </button>
              </p>
              {String.isEmpty(message) ?
                 null :
                 <p className="inset-panel padded text-warning error">
                   {string(message)}
                 </p>}
            </div>
          </li>
        </ul>
      </form>
    </section>;
  },
};
