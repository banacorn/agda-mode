open Type.View;
open Event;

type t = {
  // <Panel>
  onInquire: Event.t(Rebase.result(string, MiniEditor.error)),
  /* Input Method */
  onInputMethodChange: Event.t(InputMethod.state),
  /* Mouse Events */
  onMouseEvent: Event.t(Mouse.event),
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
