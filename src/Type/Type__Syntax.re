/* open Rebase; */

open Type__Location;

module TypeCheckingPositivity = {
  type occurrence =
    | Mixed
    | JustNeg
    | JustPos
    | StrictPos
    | GuardPos
    | Unused;
};

module Parser = {
  type parseWarning =
    | OverlappingTokensWarning(Range.t);
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
    range: Range.t,
  };
  type using_('a, 'b) =
    | UseEverything
    | Using(list(importedName_('a, 'b)));
  type importDirective_('a, 'b) = {
    range: Range.t,
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
    | TerminationMeasure(Range.t, 'a);
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
    | Ranged(Range.t, 'a);
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
    range: Range.t,
    level: precedenceLevel,
    assoc: associativity,
  };
  type fixity2 = {
    fixity,
    notation: Notation.notation,
    range: Range.t,
  };
};
module Name = {
  type nameId =
    | NameId(int, int);
  type namePart =
    | Hole
    | Id(string);
  type name =
    | Name(Range.t, list(namePart))
    | NoName(Range.t, nameId);
  type qname =
    | QName(list(name), name);
  type boundName = {
    name,
    label: name,
    fixity: Fixity.fixity2,
  };
};
open Name;
module Literal = {
  type literal =
    | LitNat(Range.t, int)
    | LitWord64(Range.t, int)
    | LitFloat(Range.t, float)
    | LitString(Range.t, string)
    | LitChar(Range.t, char)
    | LitQName(Range.t, string)
    | LitMeta(Range.t, string, int);
};
module Concrete = {
  type declarationWarning =
    | EmptyAbstract(Range.t)
    | EmptyInstance(Range.t)
    | EmptyMacro(Range.t)
    | EmptyMutual(Range.t)
    | EmptyPostulate(Range.t)
    | EmptyPrivate(Range.t)
    | InvalidCatchallPragma(Range.t)
    | InvalidNoPositivityCheckPragma(Range.t)
    | InvalidNoUniverseCheckPragma(Range.t)
    | InvalidTerminationCheckPragma(Range.t)
    | MissingDefinitions(list(name))
    | NotAllowedInMutual(Range.t, string)
    | PolarityPragmasButNotPostulates(list(name))
    | PragmaNoTerminationCheck(Range.t)
    | UnknownFixityInMixfixDecl(list(name))
    | UnknownNamesInFixityDecl(list(name))
    | UnknownNamesInPolarityPragmas(list(name))
    | UselessAbstract(Range.t)
    | UselessInstance(Range.t)
    | UselessPrivate(Range.t);
  type importDirective = CommonPrim.importDirective_(name, name);
  type asName = {
    name,
    range: Range.t,
  };
  type openShortHand =
    | DoOpen
    | DontOpen;
  type typedBinding =
    | TBind(Range.t, list(CommonPrim.withHiding(boundName)), expr)
    | TLet(Range.t, list(declaration))
  and typedBindings =
    | TypedBindings(Range.t, CommonPrim.arg(typedBinding))
  and lamBinding =
    | DomainFree(CommonPrim.argInfo, boundName)
    | DomainFull(typedBindings)
  and expr =
    | Ident(qname)
    | Lit(Literal.literal)
    | QuestionMark(Range.t, option(int))
    | Underscore(Range.t, option(string))
    | RawApp(Range.t, list(expr))
    | App(Range.t, expr, CommonPrim.namedArg(expr))
    | OpApp(Range.t, qname, list(CommonPrim.namedArg(opApp)))
    | WithApp(Range.t, expr, list(expr))
    | HiddenArg(Range.t, CommonPrim.named(expr))
    | InstanceArg(Range.t, CommonPrim.named(expr))
    | Lam(Range.t, list(lamBinding), expr)
    | AbsurdLam(Range.t, CommonPrim.hiding)
    | ExtendedLam(Range.t, list(lamBinding))
    | Fun(Range.t, CommonPrim.arg(expr), expr)
    | Pi(telescope, expr)
    | Set(Range.t)
    | Prop(Range.t)
    | SetN(Range.t, int)
    | PropN(Range.t, int)
    | Rec(Range.t, list(recordAssignment))
    | RecUpdate(Range.t, expr, list(fieldAssignmentExpr))
    | Let(Range.t, list(declaration), option(expr))
    | Paren(Range.t, expr)
    | IdiomBrackets(Range.t, expr)
    | DoBlock(Range.t, list(doStmt))
    | Absurd(Range.t)
    | As(Range.t, name, expr)
    | Dot(Range.t, expr)
    | ETel(telescope)
    | QuoteGoal(Range.t, name, expr)
    | QuoteContext(Range.t)
    | Quote(Range.t)
    | QuoteTerm(Range.t)
    | Tactic(Range.t, expr, list(expr))
    | Unquote(Range.t)
    | DontCare(expr)
    | Equal(Range.t, expr, expr)
    | Ellipsis(Range.t)
    | Generalized(expr)
  and lhs = {
    originalPattern: pattern,
    rewriteEqn: list(expr),
    withExpr: list(expr),
  }
  and fieldAssignmentExpr = {
    name,
    value: expr,
  }
  and fieldAssignmentPattern = {
    name,
    value: pattern,
  }
  and moduleAssignment = {
    name: qname,
    exprs: list(expr),
    importDirective,
  }
  and recordAssignment =
    | FieldAssignment(fieldAssignmentExpr)
    | ModuleAssignment(moduleAssignment)
  and whereClause_('a) =
    | NoWhere
    | AnyWhere('a)
    | SomeWhere(name, CommonPrim.access, 'a)
  and whereClause = whereClause_(list(declaration))
  and pattern =
    | IdentP(qname)
    | QuoteP(Range.t)
    | AppP(pattern, CommonPrim.namedArg(pattern))
    | RawAppP(Range.t, list(pattern))
    | OpAppP(Range.t, qname, list(CommonPrim.namedArg(pattern)))
    | HiddenP(Range.t, CommonPrim.named(pattern))
    | InstanceP(Range.t, CommonPrim.named(pattern))
    | ParenP(Range.t, pattern)
    | WildP(Range.t)
    | AbsurdP(Range.t)
    | AsP(Range.t, name, pattern)
    | DotP(Range.t, expr)
    | LitP(Literal.literal)
    | RecP(Range.t, list(fieldAssignmentPattern))
    | EqualP(Range.t, list((expr, expr)))
    | EllipsisP(Range.t)
    | WithP(Range.t, pattern)
  and doStmt =
    | DoBind(Range.t, pattern, expr, list(lamClause))
    | DoThen(expr)
    | DoLet(Range.t, list(declaration))
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
    | TypeSig(CommonPrim.argInfo, name, expr)
    | Generalize(CommonPrim.argInfo, name, expr)
    | Field(CommonPrim.isInstance, name, CommonPrim.arg(expr))
    | FunClause(lhs, rhs, whereClause, bool)
    | DataSig(Range.t, CommonPrim.induction, name, list(lamBinding), expr)
    | Data(
        Range.t,
        CommonPrim.induction,
        name,
        list(lamBinding),
        option(expr),
        list(declaration),
      )
    | RecordSig(Range.t, name, list(lamBinding), expr)
    | Record(
        Range.t,
        name,
        option(CommonPrim.ranged(CommonPrim.induction)),
        option(CommonPrim.hasEta),
        option((name, CommonPrim.isInstance)),
        list(lamBinding),
        option(expr),
        list(declaration),
      )
    | Infix(Fixity.fixity, list(name))
    | Syntax(name, Notation.notation)
    | PatternSyn(Range.t, name, list(CommonPrim.arg(name)), pattern)
    | Mutual(Range.t, list(declaration))
    | Abstract(Range.t, list(declaration))
    | Private(Range.t, CommonPrim.origin, list(declaration))
    | InstanceB(Range.t, list(declaration))
    | Macro(Range.t, list(declaration))
    | Postulate(Range.t, list(declaration))
    | Primitive(Range.t, list(declaration))
    | Open(Range.t, qname, importDirective)
    | Import(Range.t, qname, option(asName), openShortHand, importDirective)
    | ModuleMacro(
        Range.t,
        name,
        moduleApplication,
        openShortHand,
        importDirective,
      )
    | Module(Range.t, qname, telescope, list(declaration))
    | UnquoteDecl(Range.t, list(name), expr)
    | UnquoteUnquoteDefDecl(Range.t, list(name), expr)
    | Pragma(pragma)
  and pragma =
    | OptionsPragma(Range.t, list(string))
    | BuiltinPragma(Range.t, string, qname, Fixity.fixity2)
    | RewritePragma(Range.t, list(qname))
    | CompiledDataPragma(Range.t, qname, string, list(string))
    | CompiledTypePragma(Range.t, qname, string)
    | CompiledPragma(Range.t, qname, string)
    | CompiledExportPragma(Range.t, qname, string)
    | CompiledJSPragma(Range.t, qname, string)
    | CompiledUHCPragma(Range.t, qname, string)
    | CompiledDataUHCPragma(Range.t, qname, string, list(string))
    | HaskellCodePragma(Range.t, string)
    | ForeignPragma(Range.t, string, string)
    | CompilePragma(Range.t, string, qname, string)
    | StaticPragma(Range.t, qname)
    | InjectivePragma(Range.t, qname)
    | InlinePragma(Range.t, bool, qname)
    | ImportPragma(Range.t, string)
    | ImportUHCPragma(Range.t, string)
    | ImpossiblePragma(Range.t)
    | EtaPragma(Range.t, qname)
    | TerminationCheckPragma(Range.t, CommonPrim.terminationCheck(name))
    | WarningOnUsage(Range.t, qname, string)
    | CatchallPragma(Range.t)
    | DisplayPragma(Range.t, pattern, expr)
    | NoPositivityCheckPragma(Range.t)
    | PolarityPragma(Range.t, name, list(TypeCheckingPositivity.occurrence))
    | NoUniverseCheckPragma(Range.t)
  and moduleApplication =
    | SectionApp(Range.t, telescope, expr)
    | RecordModuleIFS(Range.t, qname)
  and opApp =
    | Placeholder(CommonPrim.positionInName)
    | SyntaxBindingLambda(
        option(CommonPrim.positionInName),
        Range.t,
        list(lamBinding),
        expr,
      )
    | Ordinary(option(CommonPrim.positionInName), expr)
  and telescope =
    | Telescope(list(typedBindings));
  type elimTerm =
    | Apply(CommonPrim.arg(expr))
    | Proj(CommonPrim.projOrigin, qname)
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
