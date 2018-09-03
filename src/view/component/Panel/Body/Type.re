module Agda = {
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
    module Concrete = {
      type nameId =
        | NameId(int, int);
      type namePart =
        | Hole
        | Id(string);
      type name =
        | Name(Position.range, list(namePart))
        | NoName(Position.range, nameId);
      type qName = list(name);
    };
    module CommonPrim = {
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
      type freeVariables =
        | UnknownFVs
        | KnownFVs(array(int));
      type argInfo = {
        hiding,
        modality,
        origin,
        freeVariables,
      };
      type arg('a) = {
        argInfo,
        value: 'a,
      };
      type ranged('a) = {
        range: Position.range,
        value: 'a,
      };
      type named('name, 'a) = {
        name: option('name),
        value: 'a,
      };
      type namedArg('a) = arg(named(ranged(string), 'a));
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
      type fixity' = {
        fixity,
        notation: Notation.notation,
        range: Position.range,
      };
    };
    module Abstract = {
      type moduleName =
        | MName(list(name))
      and name = {
        nameId: Concrete.nameId,
        concrete: Concrete.name,
        bindingSite: Position.range,
        fixity: Fixity.fixity',
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
        | LitQName(Position.range, Abstract.qName)
        | LitMeta(Position.range, string, int);
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
      type induction =
        | Inductive
        | CoInductive;
      type dom('a) = {
        argInfo: CommonPrim.argInfo,
        finite: bool,
        value: 'a,
      };
    };
    module Internal = {
      type conHead = {
        name: Abstract.qName,
        inductive: Common.induction,
        fields: list(CommonPrim.arg(Abstract.qName)),
      };
      type conInfo = Common.conOrigin;
      type abs('a) =
        | Abs(string, 'a)
        | NoAbs(string, 'a);
      type elim'('a) =
        | Apply(CommonPrim.arg('a))
        | Proj(Common.projOrigin, Abstract.qName)
        | IApply('a, 'a, 'a);
      type elim = elim'(term)
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
        | Def(Abstract.qName, list(elim))
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
    type comparison =
      | CmpLeq
      | CmpEq;
    type typeError =
      | UnequalTerms(comparison, string)
      | UnregisteredTypeError(Js.Json.t);
    type error =
      | TypeError(Syntax.Position.range, typeError)
      | Exception(Syntax.Position.range, string)
      | IOException(Syntax.Position.range, string)
      | PatternError(Syntax.Position.range);
  };
};

type event =
  | JumpToRange
  | MouseOver
  | MouseOut;
