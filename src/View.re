open Type.View;

module Event = Event;
open Event;

/************************************************************************************************************/

type handles = {
  // <Panel>
  activatePanel: Channel.t(unit, Dom.element, unit),
  deactivatePanel: Channel.t(unit, unit, unit),
  toggleDocking: Channel.t(unit, unit, unit),
  display: Channel.t((Header.t, Body.t), unit, unit),
  inquire: Channel.t((Header.t, string, string), string, MiniEditor.error),
  // events
  // onPanelActivationChange: Event.t(option(Dom.element), unit),
  updateIsPending: Channel.t(bool, unit, unit),
  updateShouldDisplay: Channel.t(bool, unit, unit),
  updateConnection:
    Event.t((option(Connection.t), option(Connection.Error.t)), unit),
  inquireConnection: Event.t(unit, unit),
  onInquireConnection: Event.t(string, MiniEditor.error),
  activateSettingsView: Event.t(bool, unit),
  onSettingsView: Event.t(bool, unit),
  navigateSettingsView: Event.t(Settings.uri, unit),
  destroy: Channel.t(unit, unit, unit),
  /* Input Method */
  activateInputMethod: Event.t(bool, unit),
  interceptAndInsertKey: Event.t(string, unit),
  onInputMethodActivationChange: Event.t(bool, unit),
  /* Mouse Events */
  onMouseEvent: Event.t(Mouse.event, unit),
};

/* creates all refs and return them */
let makeHandles = () => {
  // <Panel>
  let activatePanel = Channel.make();
  let deactivatePanel = Channel.make();
  let toggleDocking = Channel.make();

  let display = Channel.make();
  let inquire = Channel.make();

  let updateIsPending = Channel.make();
  let updateShouldDisplay = Channel.make();

  // events
  // let onPanelActivationChange = make();

  /* connection-related */
  let updateConnection = make();
  let inquireConnection = make();
  let onInquireConnection = make();

  /* <Settings> related */
  let activateSettingsView = make();
  let onSettingsView = make();
  let navigateSettingsView = make();

  /* <InputMethod> related */
  let interceptAndInsertKey = make();
  let activateInputMethod = make();
  let onInputMethodActivationChange = Event.make();
  let onMouseEvent = make();

  let destroy = Channel.make();
  {
    activatePanel,
    deactivatePanel,
    toggleDocking,
    display,
    inquire,

    updateIsPending,
    updateShouldDisplay,
    // onPanelActivationChange,
    updateConnection,
    inquireConnection,
    onInquireConnection,
    activateSettingsView,
    onSettingsView,
    navigateSettingsView,
    destroy,
    activateInputMethod,
    interceptAndInsertKey,
    onInputMethodActivationChange,
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
  activateInputMethod: bool => unit,
  interceptAndInsertKey: string => unit,
  onInputMethodActivationChange: Event.t(bool, unit),
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
let make = (handles: handles) => {
  let activate = () => handles.activatePanel |> Channel.send();
  let deactivate = () => handles.deactivatePanel |> Channel.send();
  let toggleDocking = () => handles.toggleDocking |> Channel.send();

  let display = (text, style, body) =>
    handles.display |> Channel.send(({Type.View.Header.text, style}, body));

  let inquire = (text, placeholder, value) =>
    handles.inquire
    |> Channel.send((
         {Type.View.Header.text, style: PlainText},
         placeholder,
         value,
       ));

  let updateIsPending = isPending =>
    handles.updateIsPending |> Channel.send(isPending);
  let updateShouldDisplay = shouldDisplay =>
    handles.updateShouldDisplay |> Channel.send(shouldDisplay);

  // let onPanelActivationChange = () => handles.onPanelActivationChange |> once;

  let onMouseEvent = handles.onMouseEvent;

  let activateInputMethod = activate => {
    handles.activateInputMethod |> emitOk(activate);
  };

  let interceptAndInsertKey = symbol =>
    handles.interceptAndInsertKey |> emitOk(symbol);

  let onInputMethodActivationChange = handles.onInputMethodActivationChange;

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
    |> Async.thenOk(_ => {
         activateInputMethod(false);
         Async.resolve();
       })
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
    onInputMethodActivationChange,
    navigateSettings,
    activateSettings,
    openSettings,
    updateConnection,
    onInquireConnection,
    inquireConnection,
    toggleDocking,
  };
};
