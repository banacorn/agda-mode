open Rebase;

open Type.View;

module Event = Event;

[@react.component]
let make = (~editors: Editors.t, ~events: Events.t, ~channels: Channels.t) => {
  ////////////////////////////////////////////
  // <Settings>
  ////////////////////////////////////////////
  let (settingsURI, setSettingsURI) = Hook.useState(Settings.URI.Root);
  let settingsViewRef = React.useRef(None);

  let (settingsElement, setSettingsElement) = Hook.useState(None);

  let update =
    fun
    | None => {
        React.Ref.setCurrent(settingsViewRef, None);
        setSettingsURI(Settings.URI.Root);
      }
    | Some((uri, tab)) => {
        React.Ref.setCurrent(settingsViewRef, Some(tab));

        // force-update settingsElement
        settingsViewRef
        |> React.Ref.current
        |> Option.map(Tab.getElement)
        |> setSettingsElement;

        setSettingsURI(uri);
      };

  Hook.useChannel(
    fun
    | None =>
      switch (settingsViewRef |> React.Ref.current) {
      // Close => Close
      | None => Async.resolve()
      // Open => Close
      | Some(tab) =>
        Tab.kill(tab);
        update(None);
        Async.resolve();
      }
    | Some(address) =>
      switch (settingsViewRef |> React.Ref.current) {
      // Close => Open
      | None =>
        let resource = Resource.make();
        let tab =
          Tab.make(
            ~editor=editors.source,
            ~getTitle=
              () => "[Settings] " ++ Atom.TextEditor.getTitle(editors.source),
            ~path="settings",
            ~onOpen=(_, _, _) => resource |> Resource.supply(),
            ~onClose=_ => update(None),
            (),
          );
        update(Some((address, tab)));
        resource |> Resource.acquire;
      // Open => Open
      | Some(_) => Async.resolve()
      },
    channels.navigateSettings,
  );

  let (debug, debugDispatch) =
    React.useReducer(Debug.reducer, Debug.initialState);

  let settingsActivated =
    switch (settingsViewRef |> React.Ref.current) {
    | Some(_) => true
    | None => false
    };

  let onSettingsViewToggle = shouldOpen =>
    channels.navigateSettings
    |> Channel.send(shouldOpen ? Some(Settings__Breadcrumb.Root) : None)
    |> ignore;

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
          <Settings debug targetURI=settingsURI element=settingsElement />
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
