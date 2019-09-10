open Type.View;

module Event = Event;
open Event;

/************************************************************************************************************/

type handles = {
  display: Event.t((Header.t, Body.t), unit),
  inquire: Event.t((Header.t, string, string), unit),
  toggleDocking: Event.t(unit, unit),
  activatePanel: Channel.t(unit => Async.t(Dom.element, unit)),
  deactivatePanel: Channel.t(unit => Async.t(unit, unit)),
  // events
  // onPanelActivationChange: Event.t(option(Dom.element), unit),
  onInputMethodActivationChange: Event.t(bool, unit),
  updateIsPending: Event.t(bool, unit),
  updateShouldDisplay: Event.t(bool, unit),
  updateConnection:
    Event.t((option(Connection.t), option(Connection.Error.t)), unit),
  inquireConnection: Event.t(unit, unit),
  onInquireConnection: Event.t(string, MiniEditor.error),
  inquireQuery: Event.t((string, string), unit),
  onInquireQuery: Event.t(string, MiniEditor.error),
  activateSettingsView: Event.t(bool, unit),
  onSettingsView: Event.t(bool, unit),
  navigateSettingsView: Event.t(Settings.uri, unit),
  destroy: Event.t(unit, unit),
  /* Input Method */
  activateInputMethod: Event.t(bool, unit),
  interceptAndInsertKey: Event.t(string, unit),
  /* Mouse Events */
  onMouseEvent: Event.t(Mouse.event, unit),
};

/* creates all refs and return them */
let makeHandles = () => {
  // View related
  let activatePanel = Channel.make();
  let deactivatePanel = Channel.make();
  let display = make();
  let inquire = make();
  let toggleDocking = make();

  let updateIsPending = make();
  let updateShouldDisplay = make();

  // events
  // let onPanelActivationChange = make();
  let onInputMethodActivationChange = make();

  /* connection-related */
  let updateConnection = make();
  let inquireConnection = make();
  let onInquireConnection = make();

  /* query-related */
  let onInquireQuery = make();
  let inquireQuery = make();

  /* <Settings> related */
  let activateSettingsView = make();
  let onSettingsView = make();
  let navigateSettingsView = make();

  /* <InputMethod> related */
  let interceptAndInsertKey = make();
  let activateInputMethod = make();

  let onMouseEvent = make();

  let destroy = make();
  {
    display,
    inquire,
    activatePanel,
    deactivatePanel,
    // onPanelActivationChange,
    onInputMethodActivationChange,
    toggleDocking,
    updateIsPending,
    updateShouldDisplay,
    updateConnection,
    inquireConnection,
    onInquireConnection,
    onInquireQuery,
    inquireQuery,
    activateSettingsView,
    onSettingsView,
    navigateSettingsView,
    destroy,
    activateInputMethod,
    interceptAndInsertKey,
    onMouseEvent,
  };
};

type t = {
  activate: unit => Async.t(Dom.element, unit),
  deactivate: unit => Async.t(unit, unit),
  destroy: unit => unit,
  onDestroy: unit => Async.t(unit, unit),
  updateShouldDisplay: bool => unit,
  // <Panel> related
  // onPanelActivationChange: unit => Async.t(option(Dom.element), unit),
  display: (string, Type.View.Header.style, Body.t) => unit,
  inquire: (string, string, string) => Async.t(string, MiniEditor.error),
  updateIsPending: bool => unit,
  onMouseEvent: Event.t(Mouse.event, unit),
  // <InputMethod> related
  activateInputMethod: bool => unit,
  onInputMethodActivationChange: unit => Async.t(bool, unit),
  interceptAndInsertKey: string => unit,
  // <Settings> related
  navigateSettings: Settings__Breadcrumb.uri => unit,
  activateSettings: unit => unit,
  openSettings: unit => Async.t(bool, unit),
  // <Settings/Connection> related
  updateConnection:
    (option(Connection.t), option(Connection.Error.t)) => unit,
  onInquireConnection: Event.t(string, MiniEditor.error),
  inquireConnection: unit => Async.t(string, MiniEditor.error),
  // <Tab> related
  toggleDocking: unit => unit,
};
let make = (handles: handles) => {
  let activate = () => {
    handles.activatePanel.recv() |> Async.thenOk(trigger => trigger());
  };

  let deactivate = () => {
    handles.deactivatePanel.recv() |> Async.thenOk(trigger => trigger());
  };

  let destroy = () => {
    deactivate() |> ignore;
    handles.destroy |> emitOk();
  };
  let onDestroy = () => {
    handles.destroy |> once;
  };

  let updateShouldDisplay = shouldDisplay =>
    handles.updateShouldDisplay |> emitOk(shouldDisplay) |> ignore;

  // let onPanelActivationChange = () => handles.onPanelActivationChange |> once;

  let display = (text, style, body) => {
    handles.display |> emitOk(({Type.View.Header.text, style}, body));
  };
  let inquire = (text, placeholder, value) => {
    let promise = handles.onInquireQuery |> once;
    handles.inquire
    |> emitOk((
         {Type.View.Header.text, style: PlainText},
         placeholder,
         value,
       ));
    promise;
  };

  let updateIsPending = isPending => {
    handles.updateIsPending |> emitOk(isPending);
  };
  let onMouseEvent = handles.onMouseEvent;

  let activateInputMethod = activate =>
    handles.activateInputMethod |> emitOk(activate);

  let onInputMethodActivationChange = () =>
    handles.onInputMethodActivationChange |> once;

  let interceptAndInsertKey = symbol =>
    handles.interceptAndInsertKey |> emitOk(symbol);

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

  let toggleDocking = () => {
    handles.toggleDocking |> emitOk();
  };
  {
    activate,
    deactivate,
    destroy,
    onDestroy,
    updateShouldDisplay,
    display,
    inquire,
    updateIsPending,
    onMouseEvent,
    activateInputMethod,
    onInputMethodActivationChange,
    interceptAndInsertKey,
    navigateSettings,
    activateSettings,
    openSettings,
    updateConnection,
    onInquireConnection,
    inquireConnection,
    toggleDocking,
  };
};
