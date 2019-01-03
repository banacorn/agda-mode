open ReasonReact;

open Type.Interaction;

type state = {
  maxHeight: int,
  isPending: bool,
  settingsViewOn: bool,
  inputMethodActivated: bool,
};

type action =
  | UpdateMaxHeight(int)
  | UpdateIsPending(bool)
  | UpdateInputMethodActivation(bool);

let initialState = () => {
  maxHeight: 170,
  isPending: false,
  settingsViewOn: false,
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
      ~element: option(Webapi.Dom.Element.t),
      ~onMountAtChange: mountTo => unit,
      ~body: body,
      ~header: header,
      ~mountAt: mountAt,
      ~mode: mode,
      /* Editors */
      ~onEditorConfirm: string => unit,
      ~onEditorFocused: bool => unit,
      ~onEditorCancel: (. unit) => unit,
      ~onEditorRef: Atom.TextEditor.t => unit,
      ~editorPlaceholder: string,
      ~editorValue: string,
      ~interceptAndInsertKey: (string => unit) => unit,
      ~inputMethodHandle: (bool => unit) => unit,
      /* ~onGeneralEditorChange: Editors.miniEditor => unit,
         ~onGeneralEditorConfirm: string => unit,
         ~generalEditor: Editors.miniEditor, */
      /* ~onQueryConfirm: string => unit, */
      /* ~jsonBody: Emacs.rawBody, */
      /* ~updateHeader: (jsHeaderState => unit) => unit,
         ~updateEmacsBody: (jsEmacsBodyState => unit) => unit,
         ~updateIsPending: (jsState => unit) => unit,
         ~onMountChange: string => unit,
         ~onSettingsViewToggle: bool => unit,
         ~emit, */
      _children,
    ) => {
  ...component,
  initialState,
  reducer,
  render: self => {
    let {isPending, settingsViewOn, inputMethodActivated} = self.state;
    let onSettingsViewToggle = (_) => ();
    let mountAtBottom =
      switch (mountAt) {
      | Bottom(_) => true
      | _ => false
      };
    switch (element) {
    | None => null
    | Some(elem) =>
      ReactDOMRe.createPortal(
        <section>
          <section className="panel-heading agda-header-container">
            <SizingHandle
              onResizeStart=(height => self.send(UpdateMaxHeight(height)))
              onResizeEnd=(
                height =>
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
              )
              mountAtBottom
            />
            <InputMethod
              editors
              interceptAndInsertKey
              activationHandle=inputMethodHandle
              onActivationChange=(
                activated =>
                  self.send(UpdateInputMethodActivation(activated))
              )
            />
            <Dashboard
              header
              hidden=inputMethodActivated
              isPending
              mountAt
              onMountAtChange
              settingsViewOn
              onSettingsViewToggle
            />
          </section>
          <section className="agda-body-container">
            <Body body hidden=(mode != Display) mountAtBottom />
            <MiniEditor
              hidden=(mode != Query)
              value=editorValue
              placeholder=editorPlaceholder
              grammar="agda"
              editorRef=onEditorRef
              onFocus=((.) => onEditorFocused(true))
              onBlur=((.) => onEditorFocused(false))
              onConfirm=onEditorConfirm
              onCancel=onEditorCancel
              /* onConfirm=(
                   result => {
                     onQueryConfirm(result);
                     /* core.view.editors.answerGeneral(result);
                        this.props.handelQueryValueChange(result);
                        core.view.editors.focusMain();
                        this.props.deactivateMiniEditor();
                        core.inputMethod.confirm(); */
                   }
                 )
                 onCancel=(
                   () => {
                     /* core.view.editors.rejectGeneral();
                        core.view.editors.focusMain()
                        this.props.deactivateMiniEditor();
                        core.inputMethod.cancel(); */
                   }
                 ) */
            />
          </section>
        </section>,
        elem,
      )
    };
  },
};
