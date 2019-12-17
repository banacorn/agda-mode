open Type.View;
open Event;

type t = {
  // <Panel>
  onInquire: Event.t(string, MiniEditor.error),
  /* Input Method */
  onInputMethodChange: Event.t(InputMethod.state, unit),
  /* Mouse Events */
  onMouseEvent: Event.t(Mouse.event, unit),
};

/* creates all refs and return them */
let make = () => {
  let onInquire = make();

  /* <InputMethod> related */
  let onInputMethodChange = Event.make();

  // Others
  let onMouseEvent = make();

  {onInquire, onInputMethodChange, onMouseEvent};
};
