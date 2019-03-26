open Rebase;

open Type__Location;
open Type__Syntax.Name;
open Type__Syntax.Concrete;

/* TODO: use hashmap */
type map('k, 'v) = list(('k, 'v));

type comparison =
  | CmpLeq
  | CmpEq;
type call =
  | CheckClause(expr, list(declaration))
  | CheckPattern(pattern, expr)
  | CheckLetBinding(list(declaration))
  | InferExpr(expr)
  | CheckExprCall(comparison, expr, expr)
  | CheckDotPattern(expr, expr)
  | CheckPatternShadowing(list(declaration))
  | CheckProjection(Range.t, qname, expr)
  | IsTypeCall(expr, expr)
  | IsType_(expr)
  | InferVar(name)
  | InferDef(qname)
  | CheckArguments(
      Range.t,
      list(Type__Syntax.CommonPrim.namedArg(expr)),
      expr,
    )
  | CheckTargetType(Range.t, expr, expr)
  | CheckDataDef(Range.t, name)
  | CheckRecDef(Range.t, name)
  | CheckConstructor(qname, qname)
  | CheckFunDefCall(Range.t, name)
  | CheckPragma(Range.t, pragma)
  | CheckPrimitive(Range.t, name, expr)
  | CheckIsEmpty(Range.t, expr)
  | CheckWithFunctionType(expr)
  | CheckSectionApplication(Range.t, qname, list(declaration))
  | CheckNamedWhere(qname)
  | ScopeCheckExpr(expr)
  | ScopeCheckDeclaration(list(declaration))
  | ScopeCheckLHS(qname, pattern)
  | NoHighlighting
  | ModuleContents
  | SetRange(Range.t);
type typeError =
  | GenericDocError(string)
  | GenericError(string)
  | ShouldEndInApplicationOfTheDatatype(expr)
  | ShadowedModule(qname, name, option(Type__Syntax.CommonPrim.dataOrRecord))
  | ShouldBePi(expr)
  | ShouldBeASort(expr)
  | UnequalTerms(comparison, expr, expr, expr, string)
  | ClashingDefinition(qname, Range.t)
  | ModuleArityMismatch(qname, bool, option(telescope))
  | NoRHSRequiresAbsurdPattern(list(pattern))
  | NotInScope(map(qname, list(qname)))
  | NoSuchModule(qname)
  | AmbiguousName(qname, list(qname))
  | UnregisteredTypeError(Js.Json.t);
type error =
  | TypeError(Range.t, option(call), typeError)
  | Exception(Range.t, string)
  | IOException(Range.t, string)
  | PatternError(Range.t);
type polarity =
  | Covariant
  | Contravariant
  | Invariant
  | Nonvariant;
type terminationError = {
  functions: list(qname),
  calls: list(qname),
};
type where =
  | LeftOfArrow
  | DefArg(string, int)
  | UnderInf
  | VarArg
  | MetaArg
  | ConArgType(string)
  | IndArgType(string)
  | InClause(int)
  | Matched
  | InDefOf(string);
type occursWhere =
  | Unknown
  | Known(Range.t, list(where));
type isForced =
  | Forced
  | NotForced;
type explicitToInstance =
  | ExplicitToInstance
  | ExplicitStayExplicit;
type candidate = {
  term: expr,
  type_: expr,
  eti: explicitToInstance,
  overlappable: Type__Syntax.CommonPrim.overlappable,
};
type constraint_ =
  | ValueCmp(comparison, expr, expr, expr)
  | ValueCmpOnFace(comparison, expr, expr, expr, expr)
  | ElimCmp(
      list(polarity),
      list(isForced),
      expr,
      expr,
      list(elimTerm),
      list(elimTerm),
    )
  | TypeCmp(comparison, expr, expr)
  | TelCmp(comparison, expr, expr, telescope, telescope)
  | SortCmp(comparison, expr, expr)
  | LevelCmp(comparison, expr, expr)
  | HasBiggerSort(expr)
  | HasPTSRuleNoAbs(expr, expr)
  | HasPTSRuleAbs(expr, expr)
  | UnBlock(int)
  | Guarded(constraint_, int)
  | IsEmpty(Range.t, expr)
  | CheckSizeLtSat(expr)
  | FindInScope(int, option(int), option(list(candidate)))
  | CheckFunDef(qname, list(list(declaration)));
type problemConstraint = {
  problems: array(int),
  constraint_,
};
type warning =
  | NicifierIssue(declarationWarning)
  | TerminationIssue(list(terminationError))
  | UnreachableClauses(qname)
  | CoverageIssue(qname, list(list(declaration)))
  | CoverageNoExactSplit(qname, list(list(declaration)))
  | NotStrictlyPositive(qname, occursWhere)
  | UnsolvedMetaVariables(list(Range.t))
  | UnsolvedInteractionMetas(list(Range.t))
  | UnsolvedConstraints(list(problemConstraint))
  | AbsurdPatternRequiresNoRHS
  | OldBuiltin(string, string)
  | EmptyRewritePragma
  | UselessPublic
  | UselessInline(qname)
  | InversionDepthReached(qname)
  | GenericWarning(string)
  | GenericNonFatalError(string)
  | SafeFlagPostulate(name)
  | SafeFlagPragma(list(string))
  | SafeFlagNonTerminating
  | SafeFlagTerminating
  | SafeFlagPrimTrustMe
  | SafeFlagNoPositivityCheck
  | SafeFlagPolarity
  | SafeFlagNoUniverseCheck
  | ParseWarning(Type__Syntax.Parser.parseWarning)
  | DeprecationWarning(string, string, string)
  | UserWarning(string)
  | ModuleDoesntExport(
      qname,
      list(Type__Syntax.CommonPrim.importedName_(qname, list(name))),
    );
type tcWarning = {
  cached: bool,
  range: Range.t,
  /* warning, */
  warning': string,
};
