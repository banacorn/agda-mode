open Rebase;

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
module Emacs = {
  type term =
    | Plain(string)
    | QuestionMark(string)
    | Underscore(string);
  type expr = array(term);
  type outputConstraint =
    | OfType(expr, expr)
    | JustType(expr)
    | JustSort(expr)
    | Others(expr);
  type goal =
    | Goal(expr);
  type have =
    | Have(expr);
  type output =
    | Output(outputConstraint, option(Type__Syntax.Position.range));
  type textOrRange =
    | Text(string)
    | Range(Type__Syntax.Position.range);
  /* array(result(string, )); */
  type warningError =
    | WarningMessage(array(textOrRange))
    | ErrorMessage(array(textOrRange));
  type allGoalsWarnings = {
    title: string,
    interactionMetas: array(output),
    hiddenMetas: array(output),
    warnings: array(warningError),
    errors: array(warningError),
  };
  type goalTypeContext = {
    goal: option(goal),
    have: option(have),
    interactionMetas: array(output),
    hiddenMetas: array(output),
  };
  type body =
    | AllGoalsWarnings(allGoalsWarnings)
    | GoalTypeContext(string)
    | Context(string)
    | Constraints(string)
    | WhyInScope(string)
    | SearchAbout(string)
    | Error(string)
    | PlainText(string);
};
type body =
  | Nothing
  | Emacs(Emacs.body)
  | JSON(JSON.rawBody);
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
  | JumpToRange(Type__Syntax.Position.range)
  | MouseOver(Type__Syntax.Position.range)
  | MouseOut(Type__Syntax.Position.range);
module MouseEmitter =
  Context.MakePair({
    type t = mouseEvent => unit;
    let defaultValue = _ => ();
  });
