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
    type qName =
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
    type qName =
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
      | Opened(C.qName, whyInScope)
      | Applied(C.qName, whyInScope);
    type abstractName = {
      name: A.qName,
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
      namesInScope: array(A.qName),
    };
    type scopeNameSpaces = list((nameSpaceId, nameSpace));
    type scope = {
      name: list(A.name),
      parents: list(list(A.name)),
      nameSpaces: scopeNameSpaces,
      imports: map(C.qName, list(A.name)),
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
  /* open A;
     type expr =
       | Var(name)
       | Def(qName)
       | Proj(CommonPrim.projOrigin, list(qName))
       | Con(list(qName))
       | PatternSyn(list(qName))
       | Macro(qName)
       | Lit(literal)
       | QuestionMark(Info.metaInfo, int)
       | Underscore(Info.metaInfo)
       /*
        | Dot(ExprInfo, Expr)
         | App(AppInfo ,Expr, (NamedArg (Expr)))
         | WithApp( ExprInfo, Expr , list(expr) )
         | Lam( ExprInfo, LamBinding, Expr)
         | AbsurdLam( ExprInfo, Hiding      )
         | ExtendedLam (ExprInfo, DefInfo, QName ,[Clause])
         | Pi   ExprInfo Telescope Expr
         | Generalized (Set.Set QName) Expr
         | Fun  ExprInfo (Arg Expr) Expr
         | Set  ExprInfo Integer
         | Prop ExprInfo Integer
         | Let  ExprInfo [LetBinding] Expr
         | ETel Telescope
         | Rec  ExprInfo RecordAssigns
         | RecUpdate ExprInfo Expr Assigns
         | ScopedExpr ScopeInfo Expr
         | QuoteGoal ExprInfo Name Expr
         | QuoteContext ExprInfo
         | Quote ExprInfo
         | QuoteTerm ExprInfo
         | Unquote ExprInfo
         | Tactic ExprInfo Expr [NamedArg Expr] [NamedArg Expr] */
       | DontCare(expr) */
  module Literal = {
    type literal =
      | LitNat(Position.range, int)
      | LitWord64(Position.range, int)
      | LitFloat(Position.range, float)
      | LitString(Position.range, string)
      | LitChar(Position.range, char)
      | LitQName(Position.range, A.qName)
      | LitMeta(Position.range, string, int);
  };
  module Concrete = {
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
      | Ident(C.qName)
      | Lit(Literal.literal)
      | QuestionMark(Position.range, option(int))
      | Underscore(Position.range, option(string))
      | RawApp(Position.range, list(expr))
      | App(Position.range, expr, CommonPrim.namedArg(expr))
      | OpApp(
          Position.range,
          C.qName,
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
      name: C.qName,
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
      | IdentP(C.qName)
      | QuoteP(Position.range)
      | AppP(pattern, CommonPrim.namedArg(pattern))
      | RawAppP(Position.range, list(pattern))
      | OpAppP(
          Position.range,
          C.qName,
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
      | Open(Position.range, C.qName, importDirective)
      | Import(
          Position.range,
          C.qName,
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
          C.qName,
          list(typedBindings),
          list(declaration),
        )
      | UnquoteDecl(Position.range, list(C.name), expr)
      | UnquoteUnquoteDefDecl(Position.range, list(C.name), expr)
      | Pragma(pragma)
    and pragma =
      | OptionsPragma(Position.range, list(string))
      | BuiltinPragma(Position.range, string, C.qName, Fixity.fixity2)
      | RewritePragma(Position.range, list(C.qName))
      | CompiledDataPragma(Position.range, C.qName, string, list(string))
      | CompiledTypePragma(Position.range, C.qName, string)
      | CompiledPragma(Position.range, C.qName, string)
      | CompiledExportPragma(Position.range, C.qName, string)
      | CompiledJSPragma(Position.range, C.qName, string)
      | CompiledUHCPragma(Position.range, C.qName, string)
      | CompiledDataUHCPragma(Position.range, C.qName, string, list(string))
      | HaskellCodePragma(Position.range, string)
      | ForeignPragma(Position.range, string, string)
      | CompilePragma(Position.range, string, C.qName, string)
      | StaticPragma(Position.range, C.qName)
      | InjectivePragma(Position.range, C.qName)
      | InlinePragma(Position.range, bool, C.qName)
      | ImportPragma(Position.range, string)
      | ImportUHCPragma(Position.range, string)
      | ImpossiblePragma(Position.range)
      | EtaPragma(Position.range, C.qName)
      | TerminationCheckPragma(
          Position.range,
          CommonPrim.terminationCheck(C.name),
        )
      | WarningOnUsage(Position.range, C.qName, string)
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
      | RecordModuleIFS(Position.range, C.qName)
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
  module Internal = {
    type conHead = {
      name: A.qName,
      inductive: CommonPrim.induction,
      fields: list(CommonPrim.arg(A.qName)),
    };
    type conInfo = Common.conOrigin;
    type abs('a) =
      | Abs(string, 'a)
      | NoAbs(string, 'a);
    type elim_('a) =
      | Apply(CommonPrim.arg('a))
      | Proj(CommonPrim.projOrigin, A.qName)
      | IApply('a, 'a, 'a);
    type elim = elim_(term)
    and notBlocked =
      | StuckOn(elim)
      | Underapplied
      | AbsurdMatch
      | MissingClauses
      | ReallyNotBlocked
    and levelAtom =
      | MetalLevel(int, list(elim))
      | BlockedLevel(int, term)
      | NeutralLevel(notBlocked, term)
      | UnreducedLevel(term)
    and plusLevel =
      | ClosedLevel(int)
      | Plus(int, levelAtom)
    and level = list(plusLevel)
    and sort =
      | Type(level)
      | Prop(level)
      | Inf
      | SizeUniv
      | PiSort(sort, abs(sort))
      | UnivSort(sort)
      | MetaS(int, list(elim))
    and type_ = {
      sort,
      value: term,
    }
    and term =
      | Var(int, list(elim))
      | Lam(CommonPrim.argInfo, abs(term))
      | Lit(Literal.literal)
      | Def(A.qName, list(elim))
      | Con(conHead, conInfo, list(elim))
      | Pi(Common.dom(type_), abs(type_))
      | Sort(sort)
      | Level(level)
      | MetaV(int, list(elim))
      | DontCare(term)
      | Dummy(string);
  };
};

module TypeChecking = {
  type rep('a, 'b) = {
    internal: 'a,
    concrete: 'b,
  };
  type repTerm = rep(Syntax.Internal.term, Syntax.Concrete.expr);
  type repType = rep(Syntax.Internal.type_, Syntax.Concrete.expr);
  type comparison =
    | CmpLeq
    | CmpEq;
  type call =
    | CheckClause(repType, list(Syntax.Concrete.declaration))
    | CheckPattern(Syntax.Concrete.pattern, repType)
    | CheckLetBinding(list(Syntax.Concrete.declaration))
    | InferExpr(Syntax.Concrete.expr)
    | CheckExprCall(comparison, Syntax.Concrete.expr, repType)
    | CheckDotPattern(Syntax.Concrete.expr, repType)
    | CheckPatternShadowing(list(Syntax.Concrete.declaration))
    | CheckProjection(Syntax.Position.range, Syntax.C.qName, repType)
    | IsTypeCall(Syntax.Concrete.expr, Syntax.Internal.sort)
    | IsType_(Syntax.Concrete.expr)
    | InferVar(Syntax.C.name)
    | InferDef(Syntax.C.qName)
    | CheckArguments(
        Syntax.Position.range,
        list(Syntax.CommonPrim.namedArg(Syntax.Concrete.expr)),
        repType,
      )
    | CheckTargetType(Syntax.Position.range, repType, repType)
    | CheckDataDef(Syntax.Position.range, Syntax.C.name)
    | CheckRecDef(Syntax.Position.range, Syntax.C.name)
    | CheckConstructor(Syntax.C.qName, Syntax.C.qName)
    | CheckFunDefCall(Syntax.Position.range, Syntax.C.name)
    | CheckPragma(Syntax.Position.range, Syntax.Concrete.pragma)
    | CheckPrimitive(
        Syntax.Position.range,
        Syntax.C.name,
        Syntax.Concrete.expr,
      )
    | CheckIsEmpty(Syntax.Position.range, repType)
    | CheckWithFunctionType(Syntax.Concrete.expr)
    | CheckSectionApplication(
        Syntax.Position.range,
        Syntax.C.qName,
        Syntax.Concrete.moduleApplication,
      )
    | CheckNamedWhere(Syntax.C.qName)
    | ScopeCheckExpr(Syntax.Concrete.expr)
    | ScopeCheckDeclaration(list(Syntax.Concrete.declaration))
    | ScopeCheckLHS(Syntax.C.qName, Syntax.Concrete.pattern)
    | NoHighlighting
    | ModuleContents
    | SetRange(Syntax.Position.range);
  type typeError =
    | GenericError(string)
    | ShouldEndInApplicationOfTheDatatype(repType)
    | ShouldBePi(repType)
    | ShouldBeASort(repType)
    | UnequalTerms(comparison, repTerm, repTerm, repType, string)
    | ClashingDefinition(Syntax.C.qName, Syntax.Position.range)
    | NotInScope(map(Syntax.C.qName, list(Syntax.C.qName)))
    | UnregisteredTypeError(Js.Json.t);
  type error =
    | TypeError(Syntax.Position.range, call, typeError)
    | Exception(Syntax.Position.range, string)
    | IOException(Syntax.Position.range, string)
    | PatternError(Syntax.Position.range);
};

type underscore('t) = 't => bool;

type toString('t) = 't => string;
