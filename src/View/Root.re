open Rebase;

open Type.View;

module Event = Event;

[@react.component]
let make = (~editors: Editors.t, ~events: Events.t, ~channels: Channels.t) => {
  ////////////////////////////////////////////
  // <Settings>
  ////////////////////////////////////////////

  // let (targetURI, setTargetURI) = Hook.useState(None);
  let (currentURI, setCurrentURI) = Hook.useState(None);
  let (settingsView, setSettingsView) = Hook.useState(None);
  let settingsElement = settingsView |> Option.map(Tab.getElement);

  // input
  // Hook.useChannel(setTargetURI, channels.navigateSettings);

  Hook.useChannel(
    fun
    | None =>
      switch (settingsView) {
      // Close => Close
      | None => Async.resolve()
      // Open => Close
      | Some(tab) =>
        Tab.kill(tab);
        setSettingsView(None);
        Async.resolve();
      }
    | Some(address) =>
      switch (settingsView) {
      // Close => Open
      | None =>
        Js.log2("create", address);
        let event = Event.make();
        let promise = event |> Event.once;
        let tab =
          Tab.make(
            ~editor=editors.source,
            ~getTitle=
              () => "[Settings] " ++ Atom.TextEditor.getTitle(editors.source),
            ~path="settings",
            ~onOpen=
              (_, _, _) => {
                Js.log2("opened", address);
                setCurrentURI(Some(address));
                event |> Event.emitOk();
              },
            ~onClose=
              _ => {
                Js.log("closed");
                setCurrentURI(None);
              },
            (),
          );
        setSettingsView(Some(tab));
        promise;
      // Open => Open
      | Some(_) => Async.resolve()
      },
    channels.navigateSettings,
  );

  let (debug, debugDispatch) =
    React.useReducer(Debug.reducer, Debug.initialState);

  let settingsActivated =
    switch (currentURI) {
    | Some(_) => true
    | None => false
    };

  let uri =
    switch (currentURI) {
    | None => Settings.URI.Root
    | Some(uri) => uri
    };

  let onSettingsViewToggle =
    fun
    | true =>
      channels.navigateSettings
      |> Channel.send(Some(Settings__Breadcrumb.Root))
      |> ignore
    | false => channels.navigateSettings |> Channel.send(None) |> ignore;

  let {Events.onInputMethodChange} = events;
  <>
    <Channels.Provider value=channels>
      <Mouse.Provider
        value={event => events.onMouseEvent |> Event.emitOk(event)}>
        <Debug.Provider value=debugDispatch>
          <Panel
            editors
            settingsActivated
            onInputMethodChange
            onSettingsViewToggle
            onInquireQuery={events.onInquire}
          />
          <Settings debug targetURI=uri element=settingsElement />
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
