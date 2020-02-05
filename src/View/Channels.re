open Type.View;

module Event = Event;
// open Event;

type t = {
  // lifecycle
  destroy: Channel.t(unit, unit),
  // <Panel>
  activatePanel: Channel.t(unit, Dom.element),
  deactivatePanel: Channel.t(unit, unit),
  toggleDocking: Channel.t(unit, unit),
  display: Channel.t((Header.t, Body.t), unit),
  inquire:
    Channel.t(
      (Header.t, string, string),
      Rebase.result(string, MiniEditor.error),
    ),
  updateIsPending: Channel.t(bool, unit),
  // updateShouldDisplay: Channel.t(bool, unit, unit),
  // Input Method
  /*
   Issue #34: https://github.com/banacorn/agda-mode/issues/34
   Intercept some keys that Bracket Matcher autocompletes
    to name them all: "{", "[", "{", "\"", "'", and `
   Because the Bracket Matcher package is too lacking, it does not responds
    to the disabling of the package itself, making it impossible to disable
    the package during the process of input.
   Instead, we hardwire the keys we wanna intercept directly from the Keymaps.
     */
  activateInputMethod: Channel.t(bool, unit),
  interceptAndInsertKey: Channel.t(string, unit),
  // <Settings>
  navigateSettings: Channel.t(option(Settings__Breadcrumb.uri), unit),
  updateConnection:
    Channel.t((option(Connection.t), option(Connection2.Error.t)), unit),
  inquireConnection:
    Channel.t(unit, Rebase.result(string, MiniEditor.error)),
};

/* creates all refs and return them */
let make = () => {
  // lifecycle
  destroy: Channel.make(),
  // <Panel>
  activatePanel: Channel.make(),
  deactivatePanel: Channel.make(),
  toggleDocking: Channel.make(),

  display: Channel.make(),
  inquire: Channel.make(),

  updateIsPending: Channel.make(),

  // <InputMethod>
  activateInputMethod: Channel.make(),
  interceptAndInsertKey: Channel.make(),

  // <Settings>
  navigateSettings: Channel.make(),
  updateConnection: Channel.make(),
  inquireConnection: Channel.make(),
};

let context = React.createContext(make());

module Provider = {
  [@bs.obj]
  external makeProps:
    (~value: t, ~children: React.element, unit) =>
    {
      .
      "children": React.element,
      "value": t,
    } =
    "";
  let make = React.Context.provider(context);
};