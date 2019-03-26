/* open Rebase; */

module TypeCheckingPositivity = {
  type occurrence =
    | Mixed
    | JustNeg
    | JustPos
    | StrictPos
    | GuardPos
    | Unused;
};

module Position = {
  type srcFile = option(string);
  type position = {
    pos: option(int),
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

  let toAtomRange = interval => {
    let start =
      Atom.Point.make(interval.start.line - 1, interval.start.col - 1);
    let end_ = Atom.Point.make(interval.end_.line - 1, interval.end_.col - 1);
    Atom.Range.make(start, end_);
  };
  let toAtomRanges = range => {
    switch (range) {
    | NoRange => [||]
    | Range(_, intervals) =>
      intervals |> Rebase.Array.fromList |> Rebase.Array.map(toAtomRange)
    };
  };
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
module Name = {
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
open Name;
module Literal = {
  type literal =
    | LitNat(Position.range, int)
    | LitWord64(Position.range, int)
    | LitFloat(Position.range, float)
    | LitString(Position.range, string)
    | LitChar(Position.range, char)
    | LitQName(Position.range, string)
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
    | MissingDefinitions(list(name))
    | NotAllowedInMutual(Position.range, string)
    | PolarityPragmasButNotPostulates(list(name))
    | PragmaNoTerminationCheck(Position.range)
    | UnknownFixityInMixfixDecl(list(name))
    | UnknownNamesInFixityDecl(list(name))
    | UnknownNamesInPolarityPragmas(list(name))
    | UselessAbstract(Position.range)
    | UselessInstance(Position.range)
    | UselessPrivate(Position.range);
  type importDirective = CommonPrim.importDirective_(name, name);
  type asName = {
    name,
    range: Position.range,
  };
  type openShortHand =
    | DoOpen
    | DontOpen;
  type typedBinding =
    | TBind(Position.range, list(CommonPrim.withHiding(boundName)), expr)
    | TLet(Position.range, list(declaration))
  and typedBindings =
    | TypedBindings(Position.range, CommonPrim.arg(typedBinding))
  and lamBinding =
    | DomainFree(CommonPrim.argInfo, boundName)
    | DomainFull(typedBindings)
  and expr =
    | Ident(qname)
    | Lit(Literal.literal)
    | QuestionMark(Position.range, option(int))
    | Underscore(Position.range, option(string))
    | RawApp(Position.range, list(expr))
    | App(Position.range, expr, CommonPrim.namedArg(expr))
    | OpApp(Position.range, qname, list(CommonPrim.namedArg(opApp)))
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
    | As(Position.range, name, expr)
    | Dot(Position.range, expr)
    | ETel(telescope)
    | QuoteGoal(Position.range, name, expr)
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
    | QuoteP(Position.range)
    | AppP(pattern, CommonPrim.namedArg(pattern))
    | RawAppP(Position.range, list(pattern))
    | OpAppP(Position.range, qname, list(CommonPrim.namedArg(pattern)))
    | HiddenP(Position.range, CommonPrim.named(pattern))
    | InstanceP(Position.range, CommonPrim.named(pattern))
    | ParenP(Position.range, pattern)
    | WildP(Position.range)
    | AbsurdP(Position.range)
    | AsP(Position.range, name, pattern)
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
    | TypeSig(CommonPrim.argInfo, name, expr)
    | Generalize(CommonPrim.argInfo, name, expr)
    | Field(CommonPrim.isInstance, name, CommonPrim.arg(expr))
    | FunClause(lhs, rhs, whereClause, bool)
    | DataSig(
        Position.range,
        CommonPrim.induction,
        name,
        list(lamBinding),
        expr,
      )
    | Data(
        Position.range,
        CommonPrim.induction,
        name,
        list(lamBinding),
        option(expr),
        list(declaration),
      )
    | RecordSig(Position.range, name, list(lamBinding), expr)
    | Record(
        Position.range,
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
    | PatternSyn(Position.range, name, list(CommonPrim.arg(name)), pattern)
    | Mutual(Position.range, list(declaration))
    | Abstract(Position.range, list(declaration))
    | Private(Position.range, CommonPrim.origin, list(declaration))
    | InstanceB(Position.range, list(declaration))
    | Macro(Position.range, list(declaration))
    | Postulate(Position.range, list(declaration))
    | Primitive(Position.range, list(declaration))
    | Open(Position.range, qname, importDirective)
    | Import(
        Position.range,
        qname,
        option(asName),
        openShortHand,
        importDirective,
      )
    | ModuleMacro(
        Position.range,
        name,
        moduleApplication,
        openShortHand,
        importDirective,
      )
    | Module(Position.range, qname, telescope, list(declaration))
    | UnquoteDecl(Position.range, list(name), expr)
    | UnquoteUnquoteDefDecl(Position.range, list(name), expr)
    | Pragma(pragma)
  and pragma =
    | OptionsPragma(Position.range, list(string))
    | BuiltinPragma(Position.range, string, qname, Fixity.fixity2)
    | RewritePragma(Position.range, list(qname))
    | CompiledDataPragma(Position.range, qname, string, list(string))
    | CompiledTypePragma(Position.range, qname, string)
    | CompiledPragma(Position.range, qname, string)
    | CompiledExportPragma(Position.range, qname, string)
    | CompiledJSPragma(Position.range, qname, string)
    | CompiledUHCPragma(Position.range, qname, string)
    | CompiledDataUHCPragma(Position.range, qname, string, list(string))
    | HaskellCodePragma(Position.range, string)
    | ForeignPragma(Position.range, string, string)
    | CompilePragma(Position.range, string, qname, string)
    | StaticPragma(Position.range, qname)
    | InjectivePragma(Position.range, qname)
    | InlinePragma(Position.range, bool, qname)
    | ImportPragma(Position.range, string)
    | ImportUHCPragma(Position.range, string)
    | ImpossiblePragma(Position.range)
    | EtaPragma(Position.range, qname)
    | TerminationCheckPragma(
        Position.range,
        CommonPrim.terminationCheck(name),
      )
    | WarningOnUsage(Position.range, qname, string)
    | CatchallPragma(Position.range)
    | DisplayPragma(Position.range, pattern, expr)
    | NoPositivityCheckPragma(Position.range)
    | PolarityPragma(
        Position.range,
        name,
        list(TypeCheckingPositivity.occurrence),
      )
    | NoUniverseCheckPragma(Position.range)
  and moduleApplication =
    | SectionApp(Position.range, telescope, expr)
    | RecordModuleIFS(Position.range, qname)
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
