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
    type maybePlaceholder('e) =
      | Placeholder(positionInName)
      | NoPlaceholder(option(positionInName), 'e);
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
    type withHiding('a) = {
      hiding,
      value: 'a,
    };
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
    type moduleName =
      | MName(list(name))
    and name = {
      nameId: C.nameId,
      concrete: C.name,
      bindingSite: Position.range,
      fixity: Fixity.fixity2,
    };
    type qName = {
      module_: moduleName,
      name,
    };
  };
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
          list(
            CommonPrim.namedArg(CommonPrim.maybePlaceholder(opApp(expr))),
          ),
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
    and opApp('a) =
      | SyntaxBindingLambda(Position.range, list(lamBinding), 'a)
      | Ordinary('a)
    and telescope = list(typedBindings);
  };
  module Common = {
    type conOrigin =
      | ConOSystem
      | ConOCon
      | ConORec
      | ConOSplit;
    type projOrigin =
      | ProjPrefix
      | ProjPostfix
      | ProjSystem;
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
      | Proj(Common.projOrigin, A.qName)
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
    and typeG('a) = {
      sort,
      value: 'a,
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
      | Dummy(string)
    and type_ = typeG(term);
  };
};

module TypeChecking = {
  type termRep = {
    concrete: Syntax.Concrete.expr,
    internal: Syntax.Internal.term,
  };
  type comparison =
    | CmpLeq
    | CmpEq;
  type typeError =
    | UnequalTerms(
        comparison,
        termRep,
        termRep,
        Syntax.Internal.type_,
        string,
      )
    | UnregisteredTypeError(Js.Json.t);
  type error =
    | TypeError(Syntax.Position.range, typeError)
    | Exception(Syntax.Position.range, string)
    | IOException(Syntax.Position.range, string)
    | PatternError(Syntax.Position.range);
};

type underscore('t) = 't => bool;

type pretty('t) = 't => string;
