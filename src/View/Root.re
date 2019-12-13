open Rebase;

open Type.View;

module Event = Event;

[@react.component]
let make = (~editors: Editors.t, ~events: Events.t, ~channels: Channels.t) => {
  ////////////////////////////////////////////
  // <Settings>
  ////////////////////////////////////////////

  let (settingsActivated, setSettingsActivation) = Hook.useState(false);
  let (settingsView, setSettingsView) = Hook.useState(None);
  let settingsElement = settingsView |> Option.map(Tab.getElement);

  // input
  Hook.useEventListener(setSettingsActivation, events.activateSettingsView);

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
                events.onSettingsView |> Event.emitOk(true),
            ~onClose=
              _ => {
                setSettingsActivation(false);
                /* <Settings> is closed */
                events.onSettingsView |> Event.emitOk(false);
              },
            (),
          );
        setSettingsView(Some(tab));
        None;
      | (None, false) => None
      | (Some(_), true) =>
        /* <Settings> is opened */
        events.onSettingsView |> Event.emitOk(true);
        None;
      | (Some(tab), false) =>
        Tab.kill(tab);
        setSettingsView(None);

        /* <Settings> is closed */
        events.onSettingsView |> Event.emitOk(false);
        None;
      },
    [|settingsActivated|],
  );

  let (debug, debugDispatch) =
    React.useReducer(Debug.reducer, Debug.initialState);

  let {Events.onInputMethodChange, navigateSettingsView} = events;
  <>
    <Channels.Provider value=channels>
      <Mouse.Provider
        value={event => events.onMouseEvent |> Event.emitOk(event)}>
        <Debug.Provider value=debugDispatch>
          <Panel
            editors
            settingsActivated
            onInputMethodChange
            onSettingsViewToggle=setSettingsActivation
            onInquireQuery={events.onInquire}
          />
          <Settings
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
  let events = Events.make();
  let channels = Channels.make();
  let view = View.make(events, channels);

  let component =
    React.createElementVariadic(
      make,
      makeProps(~editors, ~events, ~channels, ()),
      [||],
    );

  ReactDOMRe.render(component, element);
  /* return the handles for drilling */
  view;
};
