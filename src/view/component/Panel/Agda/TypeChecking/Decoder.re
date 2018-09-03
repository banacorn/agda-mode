[%%debugger.chrome];

module Decode = {
  open Json.Decode;
  module Syntax = {
    module Position = {
      open Type.Agda.Syntax.Position;
      let position =
        array(int)
        |> andThen((tup, _) => {pos: tup[2], line: tup[0], col: tup[1]});
      let interval = json => {
        start: json |> field("start", position),
        end_: json |> field("end", position),
      };
      let range =
        (
          json =>
            Range(
              json |> field("source", optional(string)),
              json |> field("intervals", list(interval)),
            )
        )
        |> withDefault(NoRange);
    };
    module Concrete = {
      open Type.Agda.Syntax.Concrete;
      let nameId = json =>
        NameId(json |> field("name", int), json |> field("module", int));
      let namePart = withDefault(Hole, json => Id(json |> string));
      let name =
        field("kind", string)
        |> andThen((kind, json) =>
             switch (kind) {
             | "Name" =>
               Name(
                 json |> field("range", Position.range),
                 json |> field("parts", list(namePart)),
               )
             | "NoName" =>
               NoName(
                 json |> field("range", Position.range),
                 json |> field("name", nameId),
               )
             | _ => failwith("unknown kind of Name")
             }
           );
      let qName = json => json |> list(name);
    };
    module CommonPrim = {
      open Type.Agda.Syntax.CommonPrim;
      let overlappable =
        string
        |> andThen((kind, _json) =>
             switch (kind) {
             | "YesOverlap" => YesOverlap
             | "NoOverlap" => NoOverlap
             | _ => failwith("unknown kind of Overlappable")
             }
           );
      let relevance =
        string
        |> andThen((kind, _json) =>
             switch (kind) {
             | "Relevant" => Relevant
             | "NonStrict" => NonStrict
             | "Irrelevant" => Irrelevant
             | _ => failwith("unknown kind of Relevance")
             }
           );
      let quantity =
        string
        |> andThen((kind, _json) =>
             switch (kind) {
             | "Quantity0" => Quantity0
             | "QuantityOmega" => QuantityOmega
             | _ => failwith("unknown kind of Quantity")
             }
           );
      let modality = json => {
        relevance: json |> field("relevance", relevance),
        quantity: json |> field("quantity", quantity),
      };
      let origin =
        string
        |> andThen((kind, _json) =>
             switch (kind) {
             | "UserWritten" => UserWritten
             | "Inserted" => Inserted
             | "Reflected" => Reflected
             | "CaseSplit" => CaseSplit
             | "Substitution" => Substitution
             | _ => failwith("unknown kind of Origon")
             }
           );
      let hiding =
        field("kind", string)
        |> andThen((kind, json) =>
             switch (kind) {
             | "Hidden" => Hidden
             | "NotHidden" => NotHidden
             | "Instance" =>
               Instance(json |> field("overlappable", overlappable))
             | _ => failwith("unknown kind of Hiding")
             }
           );
      let freeVariables =
        withDefault(UnknownFVs, json => KnownFVs(json |> array(int)));
      let argInfo = json => {
        hiding: json |> field("hiding", hiding),
        modality: json |> field("modality", modality),
        origin: json |> field("origin", origin),
        freeVariables: json |> field("freeVars", freeVariables),
      };
      let arg = (decoder, json) => {
        argInfo: json |> field("argInfo", argInfo),
        value: json |> field("value", decoder),
      };
      let ranged = (decoder, json) => {
        range: json |> field("range", Position.range),
        value: json |> field("value", decoder),
      };
      let named = (nameDecoder, valueDecoder, json) => {
        name: json |> field("name", optional(nameDecoder)),
        value: json |> field("value", valueDecoder),
      };
      let namedArg = decoder => arg(named(ranged(string), decoder));
    };
    module Notation = {
      open Type.Agda.Syntax.Notation;
      let genPart =
        field("kind", string)
        |> andThen((kind, json) =>
             switch (kind) {
             | "BindHole" => BindHole(json |> field("position", int))
             | "NormalHole" =>
               NormalHole(
                 json |> field("position", CommonPrim.namedArg(int)),
               )
             | "WildHole" => WildHole(json |> field("position", int))
             | "IdPart" => IdPart(json |> field("rawName", string))
             | _ => failwith("unknown kind of GenPart")
             }
           );
      let notation = list(genPart);
    };
    module Fixity = {
      open Type.Agda.Syntax.Fixity;
      let precedenceLevel =
        withDefault(Unrelated, json => Related(json |> int));
      let associativity =
        string
        |> andThen((kind, _json) =>
             switch (kind) {
             | "NonAssoc" => NonAssoc
             | "LeftAssoc" => LeftAssoc
             | "RightAssoc" => RightAssoc
             | _ => failwith("unknown kind of Sssociativity")
             }
           );
      let fixity = json => {
        range: json |> field("range", Position.range),
        level: json |> field("level", precedenceLevel),
        assoc: json |> field("assoc", associativity),
      };
      let fixity' = json => {
        fixity: json |> field("fixity", fixity),
        notation: json |> field("notation", Notation.notation),
        range: json |> field("range", Position.range),
      };
    };
    module Abstract = {
      open Type.Agda.Syntax.Abstract;
      let rec moduleName = json => MName(json |> list(name))
      and name = json => {
        nameId: json |> field("id", Concrete.nameId),
        concrete: json |> field("concrete", Concrete.name),
        bindingSite: json |> field("bindingSite", Position.range),
        fixity: json |> field("fixity", Fixity.fixity'),
      };
      let qName = json => {
        module_: json |> field("module", moduleName),
        name: json |> field("name", name),
      };
    };
    module Literal = {
      open Type.Agda.Syntax.Literal;
      let literal =
        field("kind", string)
        |> andThen((kind, json) =>
             switch (kind) {
             | "LitNat" =>
               LitNat(
                 json |> field("range", Position.range),
                 json |> field("value", int),
               )
             | "LitWord64" =>
               LitWord64(
                 json |> field("range", Position.range),
                 json |> field("value", int),
               )
             | "LitFloat" =>
               LitFloat(
                 json |> field("range", Position.range),
                 json |> field("value", float),
               )
             | "LitString" =>
               LitString(
                 json |> field("range", Position.range),
                 json |> field("value", string),
               )
             | "LitChar" =>
               LitChar(
                 json |> field("range", Position.range),
                 json |> field("value", char),
               )
             | "LitQName" =>
               LitQName(
                 json |> field("range", Position.range),
                 json |> field("value", Abstract.qName),
               )
             | "LitMeta" =>
               LitMeta(
                 json |> field("range", Position.range),
                 json |> field("value", string),
                 json |> field("value", int),
               )
             | _ => failwith("unknown kind of Literal")
             }
           );
    };
    module Common = {
      open Type.Agda.Syntax.Common;
      let conOrigin =
        string
        |> andThen((kind, _json) =>
             switch (kind) {
             | "ConOSystem" => ConOSystem
             | "ConOCon" => ConOCon
             | "ConORec" => ConORec
             | "ConOSplit" => ConOSplit
             | _ => failwith("unknown kind of ConOrigin")
             }
           );
      let projOrigin =
        string
        |> andThen((kind, _json) =>
             switch (kind) {
             | "ProjPrefix" => ProjPrefix
             | "ProjPostfix" => ProjPostfix
             | "ProjSystem" => ProjSystem
             | _ => failwith("unknown kind of ProjOrigin")
             }
           );
      let induction =
        string
        |> andThen((kind, _json) =>
             switch (kind) {
             | "Inductive" => Inductive
             | "CoInductive" => CoInductive
             | _ => failwith("unknown kind of Induction")
             }
           );
      let dom = (decoder, json) => {
        argInfo: json |> field("argInfo", CommonPrim.argInfo),
        finite: json |> field("finite", bool),
        value: json |> field("value", decoder),
      };
    };
    module Internal = {
      open Type.Agda.Syntax.Internal;
      let conHead = json => {
        name: json |> Abstract.qName,
        inductive: json |> Common.induction,
        fields: json |> list(CommonPrim.arg(Abstract.qName)),
      };
      let conInfo = Common.conOrigin;
      let abs = decoder =>
        field("kind", string)
        |> andThen((kind, json) =>
             switch (kind) {
             | "Abs" =>
               Abs(
                 json |> field("name", string),
                 json |> field("value", decoder),
               )
             | "NoAbs" =>
               NoAbs(
                 json |> field("name", string),
                 json |> field("value", decoder),
               )
             | _ => failwith("unknown kind of Abs")
             }
           );
      let elim' = decoder =>
        field("kind", string)
        |> andThen((kind, json) =>
             switch (kind) {
             | "Apply" =>
               Apply(json |> field("arg", CommonPrim.arg(decoder)))
             | "Proj" =>
               Proj(
                 json |> field("projOrigin", Common.projOrigin),
                 json |> field("name", Abstract.qName),
               )
             | "IApply" =>
               IApply(
                 json |> field("endpoint1", decoder),
                 json |> field("endpoint2", decoder),
                 json |> field("endpoint3", decoder),
               )
             | _ => failwith("unknown kind of Elim")
             }
           );
      let rec elim = () => elim'(term())
      and notBlocked = () =>
        field("kind", string)
        |> andThen((kind, json) =>
             switch (kind) {
             | "StuckOn" => StuckOn(json |> field("elim", elim()))
             | "Underapplied" => Underapplied
             | "AbsurdMatch" => AbsurdMatch
             | "MissingClauses" => MissingClauses
             | "ReallyNotBlocked" => ReallyNotBlocked
             | _ => failwith("unknown kind of NotBlocked")
             }
           )
      and levelAtom = () =>
        field("kind", string)
        |> andThen((kind, json) =>
             switch (kind) {
             | "MetalLevel" =>
               MetalLevel(
                 json |> field("metaId", int),
                 json |> field("elims", list(elim())),
               )
             | "BlockedLevel" =>
               BlockedLevel(
                 json |> field("metaId", int),
                 json |> field("term", term()),
               )
             | "NeutralLevel" =>
               NeutralLevel(
                 json |> field("notBlocked", notBlocked()),
                 json |> field("term", term()),
               )
             | "UnreducedLevel" =>
               UnreducedLevel(json |> field("term", term()))
             | _ => failwith("unknown kind of LevelAtom")
             }
           )
      and plusLevel = () =>
        field("kind", string)
        |> andThen((kind, json) =>
             switch (kind) {
             | "ClosedLevel" => ClosedLevel(json |> field("level", int))
             | "Plus" =>
               Plus(
                 json |> field("level", int),
                 json |> field("levelAtom", levelAtom()),
               )
             | _ => failwith("unknown kind of PlusLevel")
             }
           )
      and level = json => json |> list(plusLevel())
      and sort = () =>
        field("kind", string)
        |> andThen((kind, json) =>
             switch (kind) {
             | "Type" => Type(json |> field("level", level))
             | "Prop" => Prop(json |> field("level", level))
             | "Inf" => Inf
             | "SizeUniv" => SizeUniv
             | "PiSort" =>
               PiSort(
                 json |> field("sort", sort()),
                 json |> field("binder", abs(sort())),
               )
             | "UnivSort" => UnivSort(json |> field("sort", sort()))
             | "MetaS" =>
               MetaS(
                 json |> field("metaId", int),
                 json |> field("elims", list(elim())),
               )
             | _ => failwith("unknown kind of Sort")
             }
           )
      and typeG = (decoder, json) => {
        sort: json |> field("sort", sort()),
        value: json |> field("value", decoder),
      }
      and term = () =>
        field("kind", string)
        |> andThen((kind, json) =>
             switch (kind) {
             | "Var" =>
               Var(
                 json |> field("index", int),
                 json |> field("elims", list(elim())),
               )
             | "Lam" =>
               Lam(
                 json |> field("argInfo", CommonPrim.argInfo),
                 json |> field("binder", abs(term())),
               )
             | "Lit" => Lit(json |> field("literal", Literal.literal))
             | "Def" =>
               Def(
                 json |> field("name", Abstract.qName),
                 json |> field("elims", list(elim())),
               )
             | "Con" =>
               Con(
                 json |> field("conHead", conHead),
                 json |> field("conInfo", conInfo),
                 json |> field("elims", list(elim())),
               )
             | "Pi" =>
               Pi(
                 json |> field("domain", Common.dom(type_)),
                 json |> field("binder", abs(type_)),
               )
             | "Sort" => Sort(json |> field("sort", sort()))
             | "Level" => Level(json |> field("level", level))
             | "MetaV" =>
               MetaV(
                 json |> field("metaId", int),
                 json |> field("elims", list(elim())),
               )
             | "DontCare" => DontCare(json |> field("term", term()))
             | "Dummy" => Dummy(json |> field("description", string))
             | _ => failwith("unknown kind of Term")
             }
           )
      and type_ = json => json |> typeG(term());
    };
  };
  module TypeChecking = {
    open Type.Agda.TypeChecking;
    let comparison =
      string
      |> andThen((kind, _json) =>
           switch (kind) {
           | "CmpLeq" => CmpLeq
           | _ => CmpEq
           }
         );
    let typeError =
      field("kind", string)
      |> andThen((kind, json) =>
           switch (kind) {
           | "UnequalTerms" =>
             UnequalTerms(
               json |> field("comparison", comparison),
               json |> field("term1", Syntax.Internal.term()),
               json |> field("term2", Syntax.Internal.term()),
               json |> field("type", Syntax.Internal.type_),
               json |> field("reason", string),
             )
           | _ => UnregisteredTypeError(json)
           }
         );
    let error =
      field("kind", string)
      |> andThen((kind, json) =>
           switch (kind) {
           | "TypeError" =>
             TypeError(
               json |> field("range", Syntax.Position.range),
               json |> field("typeError", typeError),
             )
           | "Exception" =>
             Exception(
               json |> field("range", Syntax.Position.range),
               json |> field("message", string),
             )
           | "IOException" =>
             IOException(
               json |> field("range", Syntax.Position.range),
               json |> field("message", string),
             )
           | "PatternError" =>
             PatternError(json |> field("range", Syntax.Position.range))
           | _ =>
             IOException(
               json |> field("range", Syntax.Position.range),
               "JSON Parse Error",
             )
           }
         );
  };
};

let parseError = (json: Js.Json.t) => json |> Decode.TypeChecking.error;
