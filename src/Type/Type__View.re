open Type__Location;

/* open Type__Type__Syntax.Name;
   open Type__Type__Syntax.Position;
   open Type__Type__Syntax.Concrete; */

module Header = {
  type style =
    | PlainText
    | Error
    | Info
    | Success
    | Warning;
  type t = {
    text: string,
    style,
  };
};
/* action  */
type mountingTarget =
  | AtBottom
  | AtPane;
/* state */
type mountingPoint =
  | Bottom(Webapi.Dom.Element.t)
  | Pane(Tab.t);
type mode =
  | Display
  | Inquire;

module Mouse = {
  type event =
    | JumpToTarget(Range.linkTarget)
    | MouseOver(Range.linkTarget)
    | MouseOut(Range.linkTarget);

  let emitter = React.createContext((_ev: event) => ());

  module Provider = {
    [@bs.obj]
    external makeProps:
      (~value: event => unit, ~children: React.element, unit) =>
      {
        .
        "children": React.element,
        "value": event => unit,
      };

    let make = React.Context.provider(emitter);
  };
};

module Debug = {
  type inputMethod = {
    activated: bool,
    markers: array(Atom.DisplayMarker.t),
    buffer: Buffer.t,
  };

  type action =
    | UpdateInputMethod(inputMethod);

  type state = {inputMethod};

  let reducer = (_state, action) => {
    switch (action) {
    | UpdateInputMethod(inputMethod) => {inputMethod: inputMethod}
    };
  };

  let initialState = {
    inputMethod: {
      activated: false,
      markers: [||],
      buffer: Buffer.initial,
    },
  };

  let debugDispatch = React.createContext((_: action) => ());

  module Provider = {
    [@bs.obj]
    external makeProps:
      (~value: action => unit, ~children: React.element, unit) =>
      {
        .
        "children": React.element,
        "value": action => unit,
      };
    let make = React.Context.provider(debugDispatch);
  };
};