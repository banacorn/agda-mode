open Type.View;

[@react.component]
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
      ~onInputMethodActivationChange: Event.t(bool, unit),
    ) => {
  let (maxHeight, setMaxHeight) = Hook.useState(170);
  let (inputMethodActivated, setInputMethodActivation) =
    Hook.useState(false);

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
          onResizeStart=setMaxHeight
          onResizeEnd={height =>
            Js.Global.setTimeout(
              () => {
                setMaxHeight(height);
                Atom.Config.set(
                  "agda-mode.maxBodyHeight",
                  string_of_int(height),
                )
                |> ignore;
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
          isActive
          onActivationChange=setInputMethodActivation
          onInputMethodActivationChange
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
          onEditorRef
          onConfirm={result => onInquireQuery |> Event.emitOk(result)}
          onCancel={() =>
            onInquireQuery |> Event.emitError(MiniEditor.Cancelled) |> ignore
          }
        />
      </section>
    </section>,
    element,
  );
};
