open Type.View;

module Event = Event;
open Event;

/************************************************************************************************************/

type handles = {
  // <Panel>
  onInquire: Event.t(string, MiniEditor.error),
  // events
  // onPanelActivationChange: Event.t(option(Dom.element), unit),
  updateConnection:
    Event.t((option(Connection.t), option(Connection.Error.t)), unit),
  inquireConnection: Event.t(unit, unit),
  onInquireConnection: Event.t(string, MiniEditor.error),
  activateSettingsView: Event.t(bool, unit),
  onSettingsView: Event.t(bool, unit),
  navigateSettingsView: Event.t(Settings.uri, unit),
  destroy: Channel.t(unit, unit, unit),
  /* Input Method */
  onInputMethodChange: Event.t(InputMethod.state, unit),
  /* Mouse Events */
  onMouseEvent: Event.t(Mouse.event, unit),
};

/* creates all refs and return them */
let makeHandles = () => {
  // <Panel>

  let onInquire = Event.make();

  /* connection-related */
  let updateConnection = make();
  let inquireConnection = make();
  let onInquireConnection = make();

  /* <Settings> related */
  let activateSettingsView = make();
  let onSettingsView = make();
  let navigateSettingsView = make();

  /* <InputMethod> related */
  let onInputMethodChange = Event.make();

  // Others
  let onMouseEvent = make();

  let destroy = Channel.make();
  {
    onInquire,
    // onPanelActivationChange,
    updateConnection,
    inquireConnection,
    onInquireConnection,
    activateSettingsView,
    onSettingsView,
    navigateSettingsView,
    destroy,
    onInputMethodChange,
    onMouseEvent,
  };
};

type t = {
  // <Panel> related
  activate: unit => Async.t(Dom.element, unit),
  deactivate: unit => Async.t(unit, unit),
  toggleDocking: unit => Async.t(unit, unit),
  display: (string, Type.View.Header.style, Body.t) => Async.t(unit, unit),
  inquire: (string, string, string) => Async.t(string, MiniEditor.error),
  updateIsPending: bool => Async.t(unit, unit),
  updateShouldDisplay: bool => Async.t(unit, unit),
  destroy: unit => Async.t(unit, unit),
  onDestroy: Event.t(unit, unit),
  // <Panel> related
  // onPanelActivationChange: unit => Async.t(option(Dom.element), unit),
  onMouseEvent: Event.t(Mouse.event, unit),
  // <InputMethod> related
  activateInputMethod: bool => Async.t(unit, unit),
  interceptAndInsertKey: string => Async.t(unit, unit),
  onInputMethodChange: Event.t(InputMethod.state, unit),
  // <Settings> related
  navigateSettings: Settings__Breadcrumb.uri => unit,
  activateSettings: unit => unit,
  openSettings: unit => Async.t(bool, unit),
  // <Settings/Connection> related
  updateConnection:
    (option(Connection.t), option(Connection.Error.t)) => unit,
  onInquireConnection: Event.t(string, MiniEditor.error),
  inquireConnection: unit => Async.t(string, MiniEditor.error),
};
let make = (handles: handles, channels: Channels.t) => {
  let activate = () => channels.activatePanel |> Channel.send();
  let deactivate = () => channels.deactivatePanel |> Channel.send();
  let toggleDocking = () => channels.toggleDocking |> Channel.send();

  let display = (text, style, body) =>
    channels.display |> Channel.send(({Type.View.Header.text, style}, body));

  let inquire = (text, placeholder, value) =>
    channels.inquire
    |> Channel.send((
         {Type.View.Header.text, style: PlainText},
         placeholder,
         value,
       ));

  let updateIsPending = isPending =>
    channels.updateIsPending |> Channel.send(isPending);
  let updateShouldDisplay = shouldDisplay =>
    channels.updateShouldDisplay |> Channel.send(shouldDisplay);

  // let onPanelActivationChange = () => handles.onPanelActivationChange |> once;

  let onMouseEvent = handles.onMouseEvent;

  let activateInputMethod = activate =>
    channels.activateInputMethod |> Channel.send(activate);

  let interceptAndInsertKey = symbol =>
    channels.interceptAndInsertKey |> Channel.send(symbol);

  let onInputMethodChange = handles.onInputMethodChange;

  let navigateSettings = where =>
    handles.navigateSettingsView |> emitOk(where);

  let activateSettings = () => handles.activateSettingsView |> emitOk(true);

  let openSettings = () => {
    /* listen to `onSettingsView` before triggering `activateSettingsView` */
    let promise = handles.onSettingsView |> once;
    activateSettings();
    promise;
  };

  let updateConnection = (connection, error) => {
    handles.updateConnection |> emitOk((connection, error));
  };

  let onInquireConnection = handles.onInquireConnection;
  let inquireConnection = () => {
    /* listen to `onInquireConnection` before triggering `inquireConnection` */
    let promise = onInquireConnection |> once;
    handles.inquireConnection |> emitOk();
    promise;
  };

  let onDestroy = Event.make();
  let destroy = () =>
    deactivate()
    |> Async.thenOk(_ => activateInputMethod(false))
    |> Async.thenOk(_ => handles.destroy |> Channel.send())
    |> Async.passOk(_ => onDestroy |> Event.emitOk());

  {
    activate,
    deactivate,
    display,
    inquire,
    updateIsPending,
    updateShouldDisplay,
    destroy,
    onDestroy,
    onMouseEvent,
    activateInputMethod,
    interceptAndInsertKey,
    onInputMethodChange,
    navigateSettings,
    activateSettings,
    openSettings,
    updateConnection,
    onInquireConnection,
    inquireConnection,
    toggleDocking,
  };
};
