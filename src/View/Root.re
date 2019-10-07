open Rebase;

open Type.View;

module Event = Event;

[@react.component]
let make =
    (~editors: Editors.t, ~handles: View.handles, ~channels: Channels.t) => {
  ////////////////////////////////////////////
  // <Settings>
  ////////////////////////////////////////////

  let (settingsActivated, setSettingsActivation) = Hook.useState(false);
  let (settingsView, setSettingsView) = Hook.useState(None);
  let settingsElement = settingsView |> Option.map(Tab.getElement);
  let ((connection, connectionError), setConnectionAndError) =
    Hook.useState((None, None));

  // input
  Hook.useEventListener(setSettingsActivation, handles.activateSettingsView);
  Hook.useEventListener(setConnectionAndError, handles.updateConnection);

  React.useEffect1(
    () =>
      switch (settingsView, settingsActivated) {
      | (None, true) =>
        let tab =
          Tab.make(
            ~editor=editors.source,
            ~getTitle=
              () => "[Settings] " ++ Atom.TextEditor.getTitle(editors.source),
            ~path="settings",
            ~onOpen=
              (_, _, _) =>
                /* <Settings> is opened */
                handles.View.onSettingsView |> Event.emitOk(true),
            ~onClose=
              _ => {
                setSettingsActivation(false);
                /* <Settings> is closed */
                handles.onSettingsView |> Event.emitOk(false);
              },
            (),
          );
        setSettingsView(Some(tab));
        None;
      | (None, false) => None
      | (Some(_), true) =>
        /* <Settings> is opened */
        handles.onSettingsView |> Event.emitOk(true);
        None;
      | (Some(tab), false) =>
        Tab.kill(tab);
        setSettingsView(None);

        /* <Settings> is closed */
        handles.onSettingsView |> Event.emitOk(false);
        None;
      },
    [|settingsActivated|],
  );

  let (debug, debugDispatch) =
    React.useReducer(Debug.reducer, Debug.initialState);

  let {
    View.inquireConnection,
    onInquireConnection,
    onInputMethodChange,
    navigateSettingsView,
  } = handles;
  <>
    <Channels.Provider value=channels>
      <Mouse.Provider
        value={event => handles.onMouseEvent |> Event.emitOk(event)}>
        <Debug.Provider value=debugDispatch>
          <Panel
            editors
            settingsActivated
            onInputMethodChange
            onSettingsViewToggle=setSettingsActivation
            onInquireQuery={handles.onInquire}
          />
          <Settings
            inquireConnection
            onInquireConnection
            connection
            connectionError
            debug
            element=settingsElement
            navigate=navigateSettingsView
          />
        </Debug.Provider>
      </Mouse.Provider>
    </Channels.Provider>
  </>;
};

let initialize = editors => {
  open Webapi.Dom;
  let element = document |> Document.createElement("article");
  let handles = View.makeHandles();
  let channels = Channels.make();
  let view = View.make(handles, channels);

  let component =
    React.createElementVariadic(
      make,
      makeProps(~editors, ~handles, ~channels, ()),
      [||],
    );

  ReactDOMRe.render(component, element);
  /* return the handles for drilling */
  view;
};
