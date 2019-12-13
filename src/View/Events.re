open Type.View;
open Event;

type t = {
  // <Panel>
  onInquire: Event.t(string, MiniEditor.error),
  onInquireConnection: Event.t(string, MiniEditor.error),
  onSettingsView: Event.t(bool, unit),
  inquireConnection: Event.t(unit, unit),
  activateSettingsView: Event.t(bool, unit),
  navigateSettingsView: Event.t(Settings.uri, unit),
  /* Input Method */
  onInputMethodChange: Event.t(InputMethod.state, unit),
  /* Mouse Events */
  onMouseEvent: Event.t(Mouse.event, unit),
};

/* creates all refs and return them */
let make = () => {
  let onInquire = make();

  /* connection-related */
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

  {
    onInquire,
    inquireConnection,
    onInquireConnection,
    activateSettingsView,
    onSettingsView,
    navigateSettingsView,
    onInputMethodChange,
    onMouseEvent,
  };
};
