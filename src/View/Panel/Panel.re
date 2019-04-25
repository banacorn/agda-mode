open ReasonReact;

open Type.View;

type state = {
  maxHeight: int,
  inputMethodActivated: bool,
};

type action =
  | UpdateMaxHeight(int)
  | UpdateInputMethodActivation(bool);

let initialState = () => {maxHeight: 170, inputMethodActivated: false};

let reducer = (action, state) =>
  switch (action) {
  | UpdateMaxHeight(maxHeight) => Update({...state, maxHeight})
  | UpdateInputMethodActivation(activated) =>
    Update({...state, inputMethodActivated: activated})
  };

let component = reducerComponent("Panel");

let make =
    (
      ~editors: Editors.t,
      ~element: Webapi.Dom.Element.t,
      ~onMountAtChange: mountTo => unit,
      ~body: Body.t,
      ~header: Header.t,
      ~mountAt: mountAt,
      ~mode: mode,
      ~hidden: bool,
      ~settingsView: option(Tab.t),
      ~isPending: bool,
      ~isActive: bool,
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
    let {inputMethodActivated, maxHeight} = self.state;
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
          <SizingHandle.Jsx2
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
          <InputMethod2.Jsx2
            editors
            interceptAndInsertKey
            activateInputMethod
            isActive
            onActivationChange={activated =>
              self.send(UpdateInputMethodActivation(activated))
            }
          />
          <Dashboard.Jsx2
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
          <Body.Jsx2 body hidden={mode != Display} />
          <MiniEditor.Jsx2
            hidden={mode != Inquire}
            value=editorValue
            placeholder=editorPlaceholder
            grammar="agda"
            onEditorRef
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
