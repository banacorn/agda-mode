open Rebase.Fn;
open Type.View;
open Util.React;

[@react.component]
let make =
    (
      ~editors: Editors.t,
      ~containerElement: Webapi.Dom.Element.t,
      ~onMountAtChange: mountTo => unit,
      ~body: Body.t,
      ~header: Header.t,
      ~mountAt: mountAt,
      ~mode: mode,
      ~hidden: bool,
      ~settingsView: option(Tab.t),
      ~isActive: bool,
      ~panelRef: ReactDOMRe.Ref.currentDomRef,
      /* Editors */
      ~onInquireQuery: Event.t(string, MiniEditor.error),
      ~onQueryEditorRef: Atom.TextEditor.t => unit,
      ~editorPlaceholder: string,
      ~editorValue: string,
      ~onInputMethodChange: Event.t(InputMethod.state, unit),
      ~onSettingsViewToggle: bool => unit,
    ) => {
  let channels = React.useContext(Channels.context);

  let (maxHeight, setMaxHeight) = Hook.useState(170);
  let (inputMethodActivated, setInputMethodActivation) =
    Hook.useState(false);

  // the spinning wheel
  let (isPending, setIsPending) = Hook.useState(false);

  // toggle pending spinner
  Hook.useChannel(setIsPending >> Async.resolve, channels.updateIsPending);

  React.useEffect1(
    () => {
      let destructor =
        onInputMethodChange
        |> Event.onOk(state =>
             setInputMethodActivation(state.InputMethod.activated)
           );
      Some(destructor);
    },
    [||],
  );

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
  let id = "agda-mode:" ++ Editors.getID(editors);

  ReactDOMRe.createPortal(
    <section
      ref={ReactDOMRe.Ref.domRef(panelRef)}
      className={"agda-mode-panel" ++ showWhen(!hidden)}
      id>
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
        <InputMethod editors isActive onChange=onInputMethodChange />
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
          onEditorRef=onQueryEditorRef
          onConfirm={result => onInquireQuery |> Event.emitOk(result)}
          onCancel={() =>
            onInquireQuery |> Event.emitError(MiniEditor.Cancelled) |> ignore
          }
        />
      </section>
    </section>,
    containerElement,
  );
};
