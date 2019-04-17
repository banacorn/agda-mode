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
type mouseEvent =
  | JumpToTarget(Range.linkTarget)
  | MouseOver(Range.linkTarget)
  | MouseOut(Range.linkTarget);
module MouseEmitter =
  Context.MakePair({
    type t = mouseEvent => unit;
    let defaultValue = _ => ();
  });
