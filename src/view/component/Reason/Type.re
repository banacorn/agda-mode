type either('a, 'b) =
  | Left('a)
  | Right('b);

module AgdaMode = {
  type event =
    | JumpToRange
    | MouseOver
    | MouseOut;
};

module TypeCheckingPositivity = {
  type occurrence =
    | Mixed
    | JustNeg
    | JustPos
    | StrictPos
    | GuardPos
    | Unused;
};

/* TODO: use hashmap */
type map('k, 'v) = list(('k, 'v));

module Syntax = {
  module Position = {
    type srcFile = option(string);
    type position = {
      pos: int,
      line: int,
      col: int,
    };
    type interval = {
      start: position,
      end_: position,
    };
    type range =
      | NoRange
      | Range(srcFile, list(interval));
  };
  module Parser = {
    type parseWarning =
      | OverlappingTokensWarning(Position.range);
  };
  module CommonPrim = {
    type positionInName =
      | Beginning
      | Middle
      | End;
    type importedName_('a, 'b) =
      | ImportedModule('b)
      | ImportedName('a);
    type renaming_('a, 'b) = {
      from: importedName_('a, 'b),
      to_: importedName_('a, 'b),
      range: Position.range,
    };
    type using_('a, 'b) =
      | UseEverything
      | Using(list(importedName_('a, 'b)));
    type importDirective_('a, 'b) = {
      range: Position.range,
      using: using_('a, 'b),
      hiding: list(importedName_('a, 'b)),
      impRenaming: list(renaming_('a, 'b)),
      publicOpen: bool,
    };
    type terminationCheck('a) =
      | TerminationCheck
      | NoTerminationCheck
      | NonTerminating
      | Terminating
      | TerminationMeasure(Position.range, 'a);
    type induction =
      | Inductive
      | CoInductive;
    type isInstance =
      | InstanceDef
      | NotInstanceDef;
    type delayed =
      | Delayed
      | NotDelayed;
    type hasEta =
      | NoEta
      | YesEta;
    type overlappable =
      | YesOverlap
      | NoOverlap;
    type hiding =
      | Hidden
      | Instance(overlappable)
      | NotHidden;
    type withHiding('a) =
      | WithHiding(hiding, 'a);
    type relevance =
      | Relevant
      | NonStrict
      | Irrelevant;
    type quantity =
      | Quantity0
      | QuantityOmega;
    type modality = {
      relevance,
      quantity,
    };
    type origin =
      | UserWritten
      | Inserted
      | Reflected
      | CaseSplit
      | Substitution;
    type withOrigin('a) = {
      origin,
      value: 'a,
    };
    type access =
      | PrivateAccess(origin)
      | PublicAccess
      | OnlyQualified;
    type freeVariables =
      | UnknownFVs
      | KnownFVs(array(int));
    type argInfo = {
      hiding,
      modality,
      origin,
      freeVariables,
    };
    type arg('a) =
      | Arg(argInfo, 'a);
    type ranged('a) =
      | Ranged(Position.range, 'a);
    type named('a) =
      | Named(option(ranged(string)), 'a);
    type namedArg('a) = arg(named('a));
    type projOrigin =
      | ProjPrefix
      | ProjPostfix
      | ProjSystem;
    type dataOrRecord =
      | IsData
      | IsRecord;
  };
  module Notation = {
    type genPart =
      | BindHole(int)
      | NormalHole(CommonPrim.namedArg(int))
      | WildHole(int)
      | IdPart(string);
    type notation = list(genPart);
  };
  module Fixity = {
    type precedenceLevel =
      | Unrelated
      | Related(int);
    type associativity =
      | NonAssoc
      | LeftAssoc
      | RightAssoc;
    type fixity = {
      range: Position.range,
      level: precedenceLevel,
      assoc: associativity,
    };
    type fixity2 = {
      fixity,
      notation: Notation.notation,
      range: Position.range,
    };
  };
  module C = {
    type nameId =
      | NameId(int, int);
    type namePart =
      | Hole
      | Id(string);
    type name =
      | Name(Position.range, list(namePart))
      | NoName(Position.range, nameId);
    type qname =
      | QName(list(name), name);
    type boundName = {
      name,
      label: name,
      fixity: Fixity.fixity2,
    };
  };
  module A = {
    type name = {
      nameId: C.nameId,
      concrete: C.name,
      bindingSite: Position.range,
      fixity: Fixity.fixity2,
    };
    type qname =
      | QName(list(name), name);
  };
  module Scope = {
    type nameSpaceId =
      | PrivatedNS
      | PublicNS
      | ImportedNS
      | OnlyQualifiedNS;
    type kindOfName =
      | ConName
      | FldName
      | DefName
      | PatternSynName
      | GeneralizeName
      | MacroName
      | QuotableName;
    type whyInScope =
      | Defined
      | Opened(C.qname, whyInScope)
      | Applied(C.qname, whyInScope);
    type abstractName = {
      name: A.qname,
      kind: kindOfName,
      lineage: whyInScope,
    };
    type abstractModule = {
      name: list(A.name),
      lineage: whyInScope,
    };
    type namesInScope = map(C.name, list(abstractName));
    type modulesInScope = map(C.name, list(abstractModule));
    type nameSpace = {
      names: namesInScope,
      modules: modulesInScope,
      namesInScope: array(A.qname),
    };
    type scopeNameSpaces = list((nameSpaceId, nameSpace));
    type scope = {
      name: list(A.name),
      parents: list(list(A.name)),
      nameSpaces: scopeNameSpaces,
      imports: map(C.qname, list(A.name)),
      datatypeModule: option(CommonPrim.dataOrRecord),
    };
  };
  module Info = {
    type scopeInfo = {
      current: list(A.name),
      modules: map(list(A.name), Scope.scope),
    };
    type metaInfo = {
      range: Position.range,
      scope: scopeInfo,
      number: option(int),
      nameSuggestion: string,
    };
  };
  module Literal = {
    type literal =
      | LitNat(Position.range, int)
      | LitWord64(Position.range, int)
      | LitFloat(Position.range, float)
      | LitString(Position.range, string)
      | LitChar(Position.range, char)
      | LitQName(Position.range, A.qname)
      | LitMeta(Position.range, string, int);
  };
  module Concrete = {
    type declarationWarning =
      | EmptyAbstract(Position.range)
      | EmptyInstance(Position.range)
      | EmptyMacro(Position.range)
      | EmptyMutual(Position.range)
      | EmptyPostulate(Position.range)
      | EmptyPrivate(Position.range)
      | InvalidCatchallPragma(Position.range)
      | InvalidNoPositivityCheckPragma(Position.range)
      | InvalidNoUniverseCheckPragma(Position.range)
      | InvalidTerminationCheckPragma(Position.range)
      | MissingDefinitions(list(C.name))
      | NotAllowedInMutual(Position.range, string)
      | PolarityPragmasButNotPostulates(list(C.name))
      | PragmaNoTerminationCheck(Position.range)
      | UnknownFixityInMixfixDecl(list(C.name))
      | UnknownNamesInFixityDecl(list(C.name))
      | UnknownNamesInPolarityPragmas(list(C.name))
      | UselessAbstract(Position.range)
      | UselessInstance(Position.range)
      | UselessPrivate(Position.range);
    type importDirective = CommonPrim.importDirective_(C.name, C.name);
    type asName = {
      name: C.name,
      range: Position.range,
    };
    type openShortHand =
      | DoOpen
      | DontOpen;
    type typedBinding =
      | TBind(
          Position.range,
          list(CommonPrim.withHiding(C.boundName)),
          expr,
        )
      | TLet(Position.range, list(declaration))
    and typedBindings =
      | TypedBindings(Position.range, CommonPrim.arg(typedBinding))
    and lamBinding =
      | DomainFree(CommonPrim.argInfo, C.boundName)
      | DomainFull(typedBindings)
    and expr =
      | Ident(C.qname)
      | Lit(Literal.literal)
      | QuestionMark(Position.range, option(int))
      | Underscore(Position.range, option(string))
      | RawApp(Position.range, list(expr))
      | App(Position.range, expr, CommonPrim.namedArg(expr))
      | OpApp(
          Position.range,
          C.qname,
          array(A.name),
          list(CommonPrim.namedArg(opApp)),
        )
      | WithApp(Position.range, expr, list(expr))
      | HiddenArg(Position.range, CommonPrim.named(expr))
      | InstanceArg(Position.range, CommonPrim.named(expr))
      | Lam(Position.range, list(lamBinding), expr)
      | AbsurdLam(Position.range, CommonPrim.hiding)
      | ExtendedLam(Position.range, list(lamBinding))
      | Fun(Position.range, CommonPrim.arg(expr), expr)
      | Pi(telescope, expr)
      | Set(Position.range)
      | Prop(Position.range)
      | SetN(Position.range, int)
      | PropN(Position.range, int)
      | Rec(Position.range, list(recordAssignment))
      | RecUpdate(Position.range, expr, list(fieldAssignmentExpr))
      | Let(Position.range, list(declaration), option(expr))
      | Paren(Position.range, expr)
      | IdiomBrackets(Position.range, expr)
      | DoBlock(Position.range, list(doStmt))
      | Absurd(Position.range)
      | As(Position.range, C.name, expr)
      | Dot(Position.range, expr)
      | ETel(telescope)
      | QuoteGoal(Position.range, C.name, expr)
      | QuoteContext(Position.range)
      | Quote(Position.range)
      | QuoteTerm(Position.range)
      | Tactic(Position.range, expr, list(expr))
      | Unquote(Position.range)
      | DontCare(expr)
      | Equal(Position.range, expr, expr)
      | Ellipsis(Position.range)
      | Generalized(expr)
    and lhs = {
      originalPattern: pattern,
      rewriteEqn: list(expr),
      withExpr: list(expr),
    }
    and fieldAssignmentExpr = {
      name: C.name,
      value: expr,
    }
    and fieldAssignmentPattern = {
      name: C.name,
      value: pattern,
    }
    and moduleAssignment = {
      name: C.qname,
      exprs: list(expr),
      importDirective,
    }
    and recordAssignment = either(fieldAssignmentExpr, moduleAssignment)
    and whereClause_('a) =
      | NoWhere
      | AnyWhere('a)
      | SomeWhere(C.name, CommonPrim.access, 'a)
    and whereClause = whereClause_(list(declaration))
    and pattern =
      | IdentP(C.qname)
      | QuoteP(Position.range)
      | AppP(pattern, CommonPrim.namedArg(pattern))
      | RawAppP(Position.range, list(pattern))
      | OpAppP(
          Position.range,
          C.qname,
          array(A.name),
          list(CommonPrim.namedArg(pattern)),
        )
      | HiddenP(Position.range, CommonPrim.named(pattern))
      | InstanceP(Position.range, CommonPrim.named(pattern))
      | ParenP(Position.range, pattern)
      | WildP(Position.range)
      | AbsurdP(Position.range)
      | AsP(Position.range, C.name, pattern)
      | DotP(Position.range, expr)
      | LitP(Literal.literal)
      | RecP(Position.range, list(fieldAssignmentPattern))
      | EqualP(Position.range, list((expr, expr)))
      | EllipsisP(Position.range)
      | WithP(Position.range, pattern)
    and doStmt =
      | DoBind(Position.range, pattern, expr, list(lamClause))
      | DoThen(expr)
      | DoLet(Position.range, list(declaration))
    and rhs_('e) =
      | AbsurdRHS
      | RHS('e)
    and rhs = rhs_(expr)
    and lamClause = {
      lhs,
      rhs,
      whereClause,
      catchAll: bool,
    }
    and declaration =
      | TypeSig(CommonPrim.argInfo, C.name, expr)
      | Generalize(CommonPrim.argInfo, C.name, expr)
      | Field(CommonPrim.isInstance, C.name, CommonPrim.arg(expr))
      | FunClause(lhs, rhs, whereClause, bool)
      | DataSig(
          Position.range,
          CommonPrim.induction,
          C.name,
          list(lamBinding),
          expr,
        )
      | Data(
          Position.range,
          CommonPrim.induction,
          C.name,
          list(lamBinding),
          option(expr),
          list(declaration),
        )
      | RecordSig(Position.range, C.name, list(lamBinding), expr)
      | Record(
          Position.range,
          C.name,
          option(CommonPrim.ranged(CommonPrim.induction)),
          option(CommonPrim.hasEta),
          option((C.name, CommonPrim.isInstance)),
          list(lamBinding),
          option(expr),
          list(declaration),
        )
      | Infix(Fixity.fixity, list(C.name))
      | Syntax(C.name, Notation.notation)
      | PatternSyn(
          Position.range,
          C.name,
          list(CommonPrim.arg(C.name)),
          pattern,
        )
      | Mutual(Position.range, list(declaration))
      | Abstract(Position.range, list(declaration))
      | Private(Position.range, CommonPrim.origin, list(declaration))
      | InstanceB(Position.range, list(declaration))
      | Macro(Position.range, list(declaration))
      | Postulate(Position.range, list(declaration))
      | Primitive(Position.range, list(declaration))
      | Open(Position.range, C.qname, importDirective)
      | Import(
          Position.range,
          C.qname,
          option(asName),
          openShortHand,
          importDirective,
        )
      | ModuleMacro(
          Position.range,
          C.name,
          moduleApplication,
          openShortHand,
          importDirective,
        )
      | Module(
          Position.range,
          C.qname,
          list(typedBindings),
          list(declaration),
        )
      | UnquoteDecl(Position.range, list(C.name), expr)
      | UnquoteUnquoteDefDecl(Position.range, list(C.name), expr)
      | Pragma(pragma)
    and pragma =
      | OptionsPragma(Position.range, list(string))
      | BuiltinPragma(Position.range, string, C.qname, Fixity.fixity2)
      | RewritePragma(Position.range, list(C.qname))
      | CompiledDataPragma(Position.range, C.qname, string, list(string))
      | CompiledTypePragma(Position.range, C.qname, string)
      | CompiledPragma(Position.range, C.qname, string)
      | CompiledExportPragma(Position.range, C.qname, string)
      | CompiledJSPragma(Position.range, C.qname, string)
      | CompiledUHCPragma(Position.range, C.qname, string)
      | CompiledDataUHCPragma(Position.range, C.qname, string, list(string))
      | HaskellCodePragma(Position.range, string)
      | ForeignPragma(Position.range, string, string)
      | CompilePragma(Position.range, string, C.qname, string)
      | StaticPragma(Position.range, C.qname)
      | InjectivePragma(Position.range, C.qname)
      | InlinePragma(Position.range, bool, C.qname)
      | ImportPragma(Position.range, string)
      | ImportUHCPragma(Position.range, string)
      | ImpossiblePragma(Position.range)
      | EtaPragma(Position.range, C.qname)
      | TerminationCheckPragma(
          Position.range,
          CommonPrim.terminationCheck(C.name),
        )
      | WarningOnUsage(Position.range, C.qname, string)
      | CatchallPragma(Position.range)
      | DisplayPragma(Position.range, pattern, expr)
      | NoPositivityCheckPragma(Position.range)
      | PolarityPragma(
          Position.range,
          C.name,
          list(TypeCheckingPositivity.occurrence),
        )
      | NoUniverseCheckPragma(Position.range)
    and moduleApplication =
      | SectionApp(Position.range, list(typedBindings), expr)
      | RecordModuleIFS(Position.range, C.qname)
    and opApp =
      | Placeholder(CommonPrim.positionInName)
      | SyntaxBindingLambda(
          option(CommonPrim.positionInName),
          Position.range,
          list(lamBinding),
          expr,
        )
      | Ordinary(option(CommonPrim.positionInName), expr)
    and telescope =
      | Telescope(list(typedBindings));
    type elimTerm =
      | Apply(CommonPrim.arg(expr))
      | Proj(CommonPrim.projOrigin, A.qname)
      | IApply(expr, expr, expr);
  };
  module Common = {
    type conOrigin =
      | ConOSystem
      | ConOCon
      | ConORec
      | ConOSplit;
    type dom('a) = {
      argInfo: CommonPrim.argInfo,
      finite: bool,
      value: 'a,
    };
  };
};

module TypeChecking = {
  open Syntax.Position;
  open Syntax.Concrete;
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
    | CheckProjection(range, Syntax.C.qname, expr)
    | IsTypeCall(expr, expr)
    | IsType_(expr)
    | InferVar(Syntax.C.name)
    | InferDef(Syntax.C.qname)
    | CheckArguments(range, list(Syntax.CommonPrim.namedArg(expr)), expr)
    | CheckTargetType(range, expr, expr)
    | CheckDataDef(range, Syntax.C.name)
    | CheckRecDef(range, Syntax.C.name)
    | CheckConstructor(Syntax.C.qname, Syntax.C.qname)
    | CheckFunDefCall(range, Syntax.C.name)
    | CheckPragma(range, pragma)
    | CheckPrimitive(range, Syntax.C.name, expr)
    | CheckIsEmpty(range, expr)
    | CheckWithFunctionType(expr)
    | CheckSectionApplication(range, Syntax.C.qname, list(declaration))
    | CheckNamedWhere(Syntax.C.qname)
    | ScopeCheckExpr(expr)
    | ScopeCheckDeclaration(list(declaration))
    | ScopeCheckLHS(Syntax.C.qname, pattern)
    | NoHighlighting
    | ModuleContents
    | SetRange(range);
  type typeError =
    | GenericError(string)
    | ShouldEndInApplicationOfTheDatatype(expr)
    | ShadowedModule(
        Syntax.C.qname,
        Syntax.C.name,
        option(Syntax.CommonPrim.dataOrRecord),
      )
    | ShouldBePi(expr)
    | ShouldBeASort(expr)
    | UnequalTerms(comparison, expr, expr, expr, string)
    | ClashingDefinition(Syntax.C.qname, range)
    | NoRHSRequiresAbsurdPattern(list(pattern))
    | NotInScope(map(Syntax.C.qname, list(Syntax.C.qname)))
    | NoSuchModule(Syntax.C.qname)
    | AmbiguousName(Syntax.C.qname, list(Syntax.C.qname))
    | UnregisteredTypeError(Js.Json.t);
  type error =
    | TypeError(range, call, typeError)
    | Exception(range, string)
    | IOException(range, string)
    | PatternError(range);
  type polarity =
    | Covariant
    | Contravariant
    | Invariant
    | Nonvariant;
  type terminationError = {
    functions: list(Syntax.C.qname),
    calls: list(Syntax.C.qname),
  };
  type where =
    | LeftOfArrow
    | DefArg(Syntax.C.qname, int)
    | UnderInf
    | VarArg
    | MetaArg
    | ConArgType(Syntax.C.qname)
    | IndArgType(Syntax.C.qname)
    | InClause(int)
    | Matched
    | InDefOf(Syntax.C.qname);
  type occursWhere =
    | Unknown
    | Known(range, list(where));
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
    overlappable: Syntax.CommonPrim.overlappable,
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
    | TelCmp(
        comparison,
        expr,
        expr,
        list(typedBindings),
        list(typedBindings),
      )
    | SortCmp(comparison, expr, expr)
    | LevelCmp(comparison, expr, expr)
    | HasBiggerSort(expr)
    | HasPTSRuleNoAbs(expr, expr)
    | HasPTSRuleAbs(expr, expr)
    | UnBlock(int)
    | Guarded(constraint_, int)
    | IsEmpty(range, expr)
    | CheckSizeLtSat(expr)
    | FindInScope(int, option(int), option(list(candidate)))
    | CheckFunDef(Syntax.C.qname, list(list(declaration)));
  type problemConstraint = {
    problems: array(int),
    constraint_,
  };
  type warning =
    | NicifierIssue(declarationWarning)
    | TerminationIssue(list(terminationError))
    | UnreachableClauses(Syntax.C.qname)
    | CoverageIssue(Syntax.C.qname, list(list(declaration)))
    | CoverageNoExactSplit(Syntax.C.qname, list(list(declaration)))
    | NotStrictlyPositive(Syntax.C.qname, occursWhere)
    | UnsolvedMetaVariables(list(range))
    | UnsolvedInteractionMetas(list(range))
    | UnsolvedConstraints(list(problemConstraint))
    | AbsurdPatternRequiresNoRHS
    | OldBuiltin(string, string)
    | EmptyRewritePragma
    | UselessPublic
    | UselessInline(Syntax.C.qname)
    | InversionDepthReached(Syntax.C.qname)
    | GenericWarning(string)
    | GenericNonFatalError(string)
    | SafeFlagPostulate(Syntax.C.name)
    | SafeFlagPragma(list(string))
    | SafeFlagNonTerminating
    | SafeFlagTerminating
    | SafeFlagPrimTrustMe
    | SafeFlagNoPositivityCheck
    | SafeFlagPolarity
    | SafeFlagNoUniverseCheck
    | ParseWarning(Syntax.Parser.parseWarning)
    | DeprecationWarning(string, string, string)
    | UserWarning(string)
    | ModuleDoesntExport(
        Syntax.C.qname,
        list(
          Syntax.CommonPrim.importedName_(
            Syntax.A.qname,
            list(Syntax.A.name),
          ),
        ),
      );
  type tcWarning = {
    cached: bool,
    range,
    /* warning, */
    warning': string,
  };
};

module Interaction = {
  type outputConstraint('a, 'b) =
    | OfType('b, 'a)
    | CmpInType(TypeChecking.comparison, 'a, 'b, 'b)
    | CmpElim('a, list('b), list('b))
    | JustType('b)
    | CmpTypes(TypeChecking.comparison, 'b, 'b)
    | CmpLevels(TypeChecking.comparison, 'b, 'b)
    | CmpTeles(TypeChecking.comparison, 'b, 'b)
    | JustSort('b)
    | CmpSorts(TypeChecking.comparison, 'b, 'b)
    | Guard(outputConstraint('a, 'b), int)
    | Assign('b, 'a)
    | TypedAssign('b, 'a, 'a)
    | PostponedCheckArgs('b, list('a), 'a, 'a)
    | IsEmptyType('a)
    | SizeLtSat('a)
    | FindInScopeOF('b, 'a, list(('a, 'a)))
    | PTSInstance('b, 'b);
  type metas = {
    interactionMetas:
      list(outputConstraint(Syntax.Concrete.expr, Syntax.Concrete.expr)),
    hiddenMetas:
      list(outputConstraint(Syntax.Concrete.expr, Syntax.Concrete.expr)),
    warnings: list(TypeChecking.tcWarning),
    errors: list(TypeChecking.tcWarning),
  };
};

type underscore('t) = 't => bool;

type toString('t) = 't => string;
