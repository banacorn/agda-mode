open Type.View;

/************************************************************************************************************/

type t = {
  // <Panel> related
  activate: unit => Async.t(Dom.element, unit),
  deactivate: unit => Async.t(unit, unit),
  toggleDocking: unit => Async.t(unit, unit),
  display: (string, Type.View.Header.style, Body.t) => Async.t(unit, unit),
  inquire: (string, string, string) => Async.t(string, MiniEditor.error),
  updateIsPending: bool => Async.t(unit, unit),
  destroy: unit => Async.t(unit, unit),
  onDestroy: Event.t(unit, unit),
  onMouseEvent: Event.t(Mouse.event, unit),
  // <InputMethod> related
  activateInputMethod: bool => Async.t(unit, unit),
  interceptAndInsertKey: string => Async.t(unit, unit),
  onInputMethodChange: Event.t(InputMethod.state, unit),
  // <Settings> related
  navigateSettings: Settings__Breadcrumb.uri => Async.t(unit, unit),
  // <Settings/Connection> related
  updateConnection:
    (option(Connection.t), option(Connection.Error.t)) =>
    Async.t(unit, unit),
  inquireConnection: unit => Async.t(string, MiniEditor.error),
};
let make = (events: Events.t, channels: Channels.t) => {
  let activate = () => channels.activatePanel |> Channel.send();
  let deactivate = () => channels.deactivatePanel |> Channel.send();
  let toggleDocking = () => channels.toggleDocking |> Channel.send();

  let display = (text, style, body) =>
    channels.display |> Channel.send(({Type.View.Header.text, style}, body));

  let inquire = (text, placeholder, value) =>
    activate()
    |> Async.mapError(_ => MiniEditor.Cancelled)
    |> Async.thenOk(_ =>
         channels.inquire
         |> Channel.send((
              {Type.View.Header.text, style: PlainText},
              placeholder,
              value,
            ))
       );

  let updateIsPending = isPending =>
    channels.updateIsPending |> Channel.send(isPending);

  let onMouseEvent = events.onMouseEvent;

  let activateInputMethod = activate =>
    channels.activateInputMethod |> Channel.send(activate);

  let interceptAndInsertKey = symbol =>
    channels.interceptAndInsertKey |> Channel.send(symbol);

  let onInputMethodChange = events.onInputMethodChange;

  let navigateSettings = where =>
    channels.navigateSettings |> Channel.send(Some(where));

  let updateConnection = (connection, error) =>
    channels.updateConnection |> Channel.send((connection, error));

  let inquireConnection = () => channels.inquireConnection |> Channel.send();

  let onDestroy = Event.make();
  let destroy = () =>
    deactivate()
    |> Async.thenOk(_ => activateInputMethod(false))
    |> Async.thenOk(_ => channels.destroy |> Channel.send())
    |> Async.passOk(_ => onDestroy |> Event.emitOk());

  {
    activate,
    deactivate,
    display,
    inquire,
    updateIsPending,
    destroy,
    onDestroy,
    onMouseEvent,
    activateInputMethod,
    interceptAndInsertKey,
    onInputMethodChange,
    navigateSettings,
    updateConnection,
    inquireConnection,
    toggleDocking,
  };
};
