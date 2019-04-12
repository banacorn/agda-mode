open ReasonReact;

open Type.View;

type state = {
  maxHeight: int,
  isPending: bool,
  inputMethodActivated: bool,
};

type action =
  | UpdateMaxHeight(int)
  | UpdateIsPending(bool)
  | UpdateInputMethodActivation(bool);

let initialState = () => {
  maxHeight: 170,
  isPending: false,
  inputMethodActivated: false,
};

let reducer = (action, state) =>
  switch (action) {
  | UpdateMaxHeight(maxHeight) => Update({...state, maxHeight})
  | UpdateIsPending(isPending) => Update({...state, isPending})
  | UpdateInputMethodActivation(activated) =>
    Update({...state, inputMethodActivated: activated})
  };

let component = reducerComponent("Panel");

let make =
    (
      ~editors: Editors.t,
      ~element: Webapi.Dom.Element.t,
      ~onMountAtChange: mountTo => unit,
      ~body: body,
      ~header: Header.t,
      ~mountAt: mountAt,
      ~mode: mode,
      ~hidden: bool,
      ~settingsView: option(Tab.t),
      /* Editors */
      ~onInquireQuery: Event.t(string, MiniEditor.error),
      ~onEditorRef: Atom.TextEditor.t => unit,
      ~editorPlaceholder: string,
      ~editorValue: string,
      ~interceptAndInsertKey: Event.t(string, unit),
      ~activateInputMethod: Event.t(bool, unit),
      ~onSettingsViewToggle: bool => unit,
      /* ~onGeneralEditorChange: Editors.miniEditor => unit,
         ~onGeneralEditorConfirm: string => unit,
         ~generalEditor: Editors.miniEditor, */
      /* ~onQueryConfirm: string => unit, */
      /* ~jsonBody: Emacs.rawBody, */
      /* ~updateHeader: (jsHeaderState => unit) => unit,
         ~updateEmacsBody: (jsEmacsBodyState => unit) => unit,
         ~updateIsPending: (jsState => unit) => unit,
         ~onMountChange: string => unit,
         /**/
         ~emit, */
      _children,
    ) => {
  ...component,
  initialState,
  reducer,
  render: self => {
    let {isPending, inputMethodActivated, maxHeight} = self.state;
    let mountAtBottom =
      switch (mountAt) {
      | Bottom(_) => true
      | _ => false
      };
    let style =
      mountAtBottom
        ? Some(
            ReactDOMRe.Style.make(
              ~maxHeight=string_of_int(maxHeight) ++ "px",
              (),
            ),
          )
        : None;
    let className =
      Util.ClassName.([] |> addWhen("hidden", hidden) |> serialize);
    ReactDOMRe.createPortal(
      <section className>
        <section className="panel-heading agda-header-container">
          <SizingHandle
            onResizeStart={height => self.send(UpdateMaxHeight(height))}
            onResizeEnd={height =>
              Js.Global.setTimeout(
                () => {
                  self.send(UpdateMaxHeight(height));
                  Atom.Environment.Config.set(
                    "agda-mode.maxBodyHeight",
                    string_of_int(height),
                  );
                },
                0,
              )
              |> ignore
            }
            mountAtBottom
          />
          <InputMethod
            editors
            interceptAndInsertKey
            activateInputMethod
            onActivationChange={activated =>
              self.send(UpdateInputMethodActivation(activated))
            }
          />
          <Dashboard
            header
            hidden=inputMethodActivated
            isPending
            mountAt
            settingsView
            onMountAtChange
            onSettingsViewToggle
          />
        </section>
        <section ?style className="agda-body-container">
          <Body body hidden={mode != Display} />
          <MiniEditor
            hidden={mode != Inquire}
            value=editorValue
            placeholder=editorPlaceholder
            grammar="agda"
            editorRef=onEditorRef
            onConfirm={result => onInquireQuery |> Event.emitOk(result)}
            onCancel={(.) =>
              onInquireQuery
              |> Event.emitError(MiniEditor.Cancelled)
              |> ignore
            }
          />
        </section>
      </section>,
      element,
    );
  },
};
