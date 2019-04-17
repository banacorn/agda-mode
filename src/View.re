open Type.View;

module Event = Event;

/************************************************************************************************************/

type t = {
  display: Event.t((Header.t, Body.t), unit),
  inquire: Event.t((Header.t, string, string), unit),
  toggleDocking: Event.t(unit, unit),
  activatePanel: Event.t(bool, unit),
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
  onMouseEvent: Event.t(mouseEvent, unit),
};

let hook = (f, handle) => f := handle;

/* creates all refs and return them */
let make = () => {
  /* public */
  let activatePanel = Event.make();
  let display = Event.make();
  let inquire = Event.make();
  let toggleDocking = Event.make();

  let updateIsPending = Event.make();
  let updateShouldDisplay = Event.make();

  /* private */

  /* connection-related */
  let updateConnection = Event.make();
  let inquireConnection = Event.make();
  let onInquireConnection = Event.make();

  /* query-related */
  let onInquireQuery = Event.make();
  let inquireQuery = Event.make();

  /* <Settings> related */
  let activateSettingsView = Event.make();
  let onSettingsView = Event.make();
  let navigateSettingsView = Event.make();

  /* <InputMethod> related */
  let interceptAndInsertKey = Event.make();
  let activateInputMethod = Event.make();

  let onMouseEvent = Event.make();

  let destroy = Event.make();
  {
    display,
    inquire,
    activatePanel,
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

open Type.View.Header;
open Async;
let activate = handles => {
  handles.activatePanel |> Event.emitOk(true);
};
let deactivate = handles => {
  handles.activatePanel |> Event.emitOk(false);
};
let destroy = handles => {
  deactivate(handles);
  handles.destroy |> Event.emitOk();
};

let display = (text, style, body, handles) => {
  handles.display |> Event.emitOk(({text, style}, body));
  Async.resolve();
};

let inquire =
    (text, placeholder, value, handles): Async.t(string, MiniEditor.error) => {
  let promise = handles.onInquireQuery |> Event.once;
  handles.inquire
  |> Event.emitOk(({text, style: PlainText}, placeholder, value));
  promise;
};

let toggleDocking = (handles): Async.t(unit, unit) => {
  handles.toggleDocking |> Event.emitOk();
  Async.resolve();
};

let updateIsPending = (isPending, handles): Async.t(unit, unit) => {
  handles.updateIsPending |> Event.emitOk(isPending);
  Async.resolve();
};

let updateShouldDisplay = (shouldDisplay, handles): Async.t(unit, unit) => {
  handles.updateShouldDisplay |> Event.emitOk(shouldDisplay);
  Async.resolve();
};

let onOpenSettingsView = (handles): Async.t(bool, MiniEditor.error) => {
  handles.onSettingsView |> Event.once |> mapError(_ => MiniEditor.Cancelled);
};
let navigateSettingsView = (where, handles) => {
  handles.navigateSettingsView |> Event.emitOk(where);
};
let onInquireConnection = handles => {
  handles.onInquireConnection |> Event.once;
};
let inquireConnection = handles => {
  handles.inquireConnection |> Event.emitOk();
};
let updateConnection = (connection, error, handles) => {
  handles.updateConnection |> Event.emitOk((connection, error));
};
let activateSettingsView = handles => {
  handles.activateSettingsView |> Event.emitOk(true);
};
