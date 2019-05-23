open Type__Location;

/* open Type__Type__Syntax.Name;
   open Type__Type__Syntax.Position;
   open Type__Type__Syntax.Concrete; */

module JSON = {
  type rawBody = {
    kind: string,
    rawJSON: Js.Json.t,
    rawString: string,
  };
  type outputConstraint('a, 'b) =
    | OfType('b, 'a)
    | CmpInType(Type__TypeChecking.comparison, 'a, 'b, 'b)
    | CmpElim('a, list('b), list('b))
    | JustType('b)
    | CmpTypes(Type__TypeChecking.comparison, 'b, 'b)
    | CmpLevels(Type__TypeChecking.comparison, 'b, 'b)
    | CmpTeles(Type__TypeChecking.comparison, 'b, 'b)
    | JustSort('b)
    | CmpSorts(Type__TypeChecking.comparison, 'b, 'b)
    | Guard(outputConstraint('a, 'b), int)
    | Assign('b, 'a)
    | TypedAssign('b, 'a, 'a)
    | PostponedCheckArgs('b, list('a), 'a, 'a)
    | IsEmptyType('a)
    | SizeLtSat('a)
    | FindInScopeOF('b, 'a, list(('a, 'a)))
    | PTSInstance('b, 'b);
  type allGoalsWarnings = {
    interactionMetas:
      list(
        outputConstraint(
          Type__Syntax.Concrete.expr,
          Type__Syntax.Concrete.expr,
        ),
      ),
    hiddenMetas:
      list(
        outputConstraint(
          Type__Syntax.Concrete.expr,
          Type__Syntax.Concrete.expr,
        ),
      ),
    warnings: list(Type__TypeChecking.tcWarning),
    errors: list(Type__TypeChecking.tcWarning),
  };
  type body =
    | AllGoalsWarnings(allGoalsWarnings)
    | ErrorMessage(Type__TypeChecking.error, string)
    | PlainText(string);
};

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
type mountTo =
  | ToBottom
  | ToPane;
/* state */
type mountAt =
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
      } =
      "";

    let make = React.Context.provider(emitter);
  };
};

module Debug = {
  type inputMethod = {
    activated: bool,
    markers: array(Atom.DisplayMarker.t),
    buffer: Buffer.t,
  };

  type state = {inputMethod};

  let initialState = {
    inputMethod: {
      activated: false,
      markers: [||],
      buffer: Buffer.initial,
    },
  };

  let setDebug = React.createContext((_: state) => ());

  module Provider = {
    [@bs.obj]
    external makeProps:
      (~value: state => unit, ~children: React.element, unit) =>
      {
        .
        "children": React.element,
        "value": state => unit,
      } =
      "";
    let make = React.Context.provider(setDebug);
  };
};
