open Type.View;

/************************************************************************************************************/

type t = {
  // <Panel> related
  activate: unit => Promise.t(Dom.element),
  deactivate: unit => Promise.t(unit),
  toggleDocking: unit => Promise.t(unit),
  display: (string, Type.View.Header.style, Body.t) => Promise.t(unit),
  inquire:
    (string, string, string) =>
    Promise.t(Rebase.result(string, MiniEditor.error)),
  updateIsPending: bool => Promise.t(unit),
  destroy: unit => Promise.t(unit),
  onDestroy: Event.t(unit),
  onMouseEvent: Event.t(Mouse.event),
  // <InputMethod> related
  activateInputMethod: bool => Promise.t(unit),
  interceptAndInsertKey: string => Promise.t(unit),
  onInputMethodChange: Event.t(InputMethod.state),
  // <Settings> related
  navigateSettings: Settings__Breadcrumb.uri => Promise.t(unit),
  // <Settings/Connection> related
  updateConnection:
    (option(Connection.t), option(Connection.Error.t)) => Promise.t(unit),
  inquireConnection:
    unit => Promise.t(Rebase.result(string, MiniEditor.error)),
};
let make = (events: Events.t, channels: Channels.t) => {
  let activate = () => channels.activatePanel |> Channel.send();
  let deactivate = () => channels.deactivatePanel |> Channel.send();
  let toggleDocking = () => channels.toggleDocking |> Channel.send();

  let display = (text, style, body) =>
    channels.display |> Channel.send(({Type.View.Header.text, style}, body));

  let inquire = (text, placeholder, value) =>
    activate()
    // ->Promise.mapError(_ => MiniEditor.Cancelled)
    ->Promise.flatMap(_ =>
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
    ->Promise.flatMap(_ => activateInputMethod(false))
    ->Promise.flatMap(_ => channels.destroy |> Channel.send())
    ->Promise.tap(_ => onDestroy.emit());

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
