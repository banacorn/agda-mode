[%%debugger.chrome];

open Util;
open Rebase;
module Decode = {
  open Json.Decode;
  module TypeCheckingPositivity = {
    open Type.Syntax.TypeCheckingPositivity;
    let occurrence =
      string
      |> andThen((kind, _json) =>
           switch (kind) {
           | "Mixed" => Mixed
           | "JustNeg" => JustNeg
           | "JustPos" => JustPos
           | "StrictPos" => StrictPos
           | "GuardPos" => GuardPos
           | "Unused" => Unused
           | _ => failwith("unknown kind of Occurrence")
           }
         );
  };
  module Location = {
    open Type__Location;

    let position =
      array(int)
      |> andThen((tup, _) =>
           {
             Position.pos: tup[2],
             line: tup[0] |> Option.getOr(0),
             col: tup[1] |> Option.getOr(0),
           }
         );
    let interval = json => {
      Interval.start: json |> field("start", position),
      end_: json |> field("end", position),
    };
    let range =
      field("kind", string)
      |> andThen((kind, json) =>
           switch (kind) {
           | "Range" =>
             Range.Range(
               json |> field("source", optional(string)),
               json |> field("intervals", list(interval)),
             )
           | "NoRange" => NoRange
           | _ => failwith("unknown kind of Range")
           }
         );
  };
  module Syntax = {
    module Parser = {
      open Type.Syntax.Parser;
      let parseWarning = json =>
        OverlappingTokensWarning(json |> field("range", Location.range));
    };
    module CommonPrim = {
      open Type.Syntax.CommonPrim;
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
      let positionInName =
        string
        |> andThen((kind, _json) =>
             switch (kind) {
             | "Beginning" => Beginning
             | "Middle" => Middle
             | "End" => End
             | _ => failwith("unknown kind of PositionInName")
             }
           );
      let importedName_ = (decoderA, decoderB) =>
        field("kind", string)
        |> andThen((kind, json) =>
             switch (kind) {
             | "ImportedModule" =>
               ImportedModule(json |> field("value", decoderB))
             | "ImportedName" =>
               ImportedName(json |> field("value", decoderA))
             | _ => failwith("unknown kind of ImportedName_")
             }
           );
      let renaming_ = (decoderA, decoderB, json) => {
        from: json |> field("from", importedName_(decoderA, decoderB)),
        to_: json |> field("to", importedName_(decoderA, decoderB)),
        range: json |> field("range", Location.range),
      };
      let using_ = (decoderA, decoderB) =>
        withDefault(UseEverything, json =>
          Using(
            json
            |> field(
                 "importedNames",
                 list(importedName_(decoderA, decoderB)),
               ),
          )
        );
      let importDirective_ = (decoderA, decoderB, json) => {
        range: json |> field("range", Location.range),
        using: json |> field("using", using_(decoderA, decoderB)),
        hiding:
          json |> field("hiding", list(importedName_(decoderA, decoderB))),
        impRenaming:
          json |> field("impRenaming", list(renaming_(decoderA, decoderB))),
        publicOpen: json |> field("publicOpen", bool),
      };
      let terminationCheck = decoder =>
        field("kind", string)
        |> andThen((kind, json) =>
             switch (kind) {
             | "TerminationCheck" => TerminationCheck
             | "NoTerminationCheck" => NoTerminationCheck
             | "NonTerminating" => NonTerminating
             | "Terminating" => Terminating
             | "TerminationMeasure" =>
               TerminationMeasure(
                 json |> field("range", Location.range),
                 json |> field("value", decoder),
               )
             | _ => failwith("unknown kind of TerminationCheck")
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
      let isInstance =
        string
        |> andThen((kind, _json) =>
             switch (kind) {
             | "InstanceDef" => InstanceDef
             | "NotInstanceDef" => NotInstanceDef
             | _ => failwith("unknown kind of IsInstance")
             }
           );
      let hasEta =
        string
        |> andThen((kind, _json) =>
             switch (kind) {
             | "NoEta" => NoEta
             | "YesEta" => YesEta
             | _ => failwith("unknown kind of HasEta")
             }
           );
      let overlappable =
        string
        |> andThen((kind, _json) =>
             switch (kind) {
             | "YesOverlap" => YesOverlap
             | "NoOverlap" => NoOverlap
             | _ => failwith("unknown kind of Overlappable")
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
             | _ => failwith("unknown kind of Hidden")
             }
           );
      let withHiding = (decoder, json) =>
        WithHiding(
          json |> field("hiding", hiding),
          json |> field("value", decoder),
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
      let access =
        field("kind", string)
        |> andThen((kind, json) =>
             switch (kind) {
             | "PublicAccess" => PublicAccess
             | "OnlyQualified" => OnlyQualified
             | "PrivateAccess" =>
               PrivateAccess(json |> field("origin", origin))
             | _ => failwith("unknown kind of Access")
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
      let arg = (decoder, json) =>
        Arg(
          json |> field("argInfo", argInfo),
          json |> field("value", decoder),
        );
      let ranged = (decoder, json) =>
        Ranged(
          json |> field("range", Location.range),
          json |> field("value", decoder),
        );
      let named = (decoder, json) =>
        Named(
          json |> field("name", optional(ranged(string))),
          json |> field("value", decoder),
        );
      let namedArg = decoder => arg(named(decoder));
      let dataOrRecord =
        string
        |> andThen((kind, _json) =>
             switch (kind) {
             | "IsData" => IsData
             | "IsRecord" => IsRecord
             | _ => failwith("unknown kind of DataOrRecord")
             }
           );
    };
    module Notation = {
      open Type.Syntax.Notation;
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
      open Type.Syntax.Fixity;
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
        range: json |> field("range", Location.range),
        level: json |> field("level", precedenceLevel),
        assoc: json |> field("assoc", associativity),
      };
      let fixity2 = json => {
        fixity: json |> field("fixity", fixity),
        notation: json |> field("notation", Notation.notation),
        range: json |> field("range", Location.range),
      };
    };
    module Name = {
      open Type.Syntax.Name;
      let nameId = json =>
        NameId(json |> field("name", int), json |> field("module", int));
      let namePart = withDefault(Hole, json => Id(json |> string));
      let name =
        field("kind", string)
        |> andThen((kind, json) =>
             switch (kind) {
             | "Name" =>
               Name(
                 json |> field("range", Location.range),
                 json |> field("parts", list(namePart)),
               )
             | "NoName" =>
               NoName(
                 json |> field("range", Location.range),
                 json |> field("name", nameId),
               )
             | _ => failwith("unknown kind of Name")
             }
           );
      let qname =
        list(name)
        |> andThen((names, _) =>
             QName(List_.init(names), List_.last(names))
           );
      let boundName = json => {
        name: json |> field("name", name),
        label: json |> field("label", name),
        fixity: json |> field("fixity", Fixity.fixity2),
      };
    };
    module Literal = {
      open Type.Syntax.Literal;
      let literal =
        field("kind", string)
        |> andThen((kind, json) =>
             switch (kind) {
             | "LitNat" =>
               LitNat(
                 json |> field("range", Location.range),
                 json |> field("value", int),
               )
             | "LitWord64" =>
               LitWord64(
                 json |> field("range", Location.range),
                 json |> field("value", int),
               )
             | "LitFloat" =>
               LitFloat(
                 json |> field("range", Location.range),
                 json |> field("value", float),
               )
             | "LitString" =>
               LitString(
                 json |> field("range", Location.range),
                 json |> field("value", string),
               )
             | "LitChar" =>
               LitChar(
                 json |> field("range", Location.range),
                 json |> field("value", char),
               )
             | "LitQName" =>
               LitQName(
                 json |> field("range", Location.range),
                 json |> field("value", string),
               )
             | "LitMeta" =>
               LitMeta(
                 json |> field("range", Location.range),
                 json |> field("value", string),
                 json |> field("value", int),
               )
             | _ => failwith("unknown kind of Literal")
             }
           );
    };
    module Concrete = {
      /* open Type.Syntax.Name; */
      open Name;
      open Type.Syntax.Concrete;
      let declarationWarning =
        field("kind", string)
        |> andThen((kind, json) =>
             switch (kind) {
             | "EmptyAbstract" =>
               EmptyAbstract(json |> field("range", Location.range))
             | "EmptyInstance" =>
               EmptyInstance(json |> field("range", Location.range))
             | "EmptyMacro" =>
               EmptyMacro(json |> field("range", Location.range))
             | "EmptyMutual" =>
               EmptyMutual(json |> field("range", Location.range))
             | "EmptyPostulate" =>
               EmptyPostulate(json |> field("range", Location.range))
             | "EmptyPrivate" =>
               EmptyPrivate(json |> field("range", Location.range))
             | "InvalidCatchallPragma" =>
               InvalidCatchallPragma(json |> field("range", Location.range))
             | "InvalidNoPositivityCheckPragma" =>
               InvalidNoPositivityCheckPragma(
                 json |> field("range", Location.range),
               )
             | "InvalidNoUniverseCheckPragma" =>
               InvalidNoUniverseCheckPragma(
                 json |> field("range", Location.range),
               )
             | "InvalidTerminationCheckPragma" =>
               InvalidTerminationCheckPragma(
                 json |> field("range", Location.range),
               )
             | "MissingDefinitions" =>
               MissingDefinitions(json |> field("names", list(name)))
             | "NotAllowedInMutual" =>
               NotAllowedInMutual(
                 json |> field("range", Location.range),
                 json |> field("name", string),
               )
             | "PolarityPragmasButNotPostulates" =>
               PolarityPragmasButNotPostulates(
                 json |> field("names", list(name)),
               )
             | "PragmaNoTerminationCheck" =>
               PragmaNoTerminationCheck(
                 json |> field("range", Location.range),
               )
             | "UnknownFixityInMixfixDecl" =>
               UnknownFixityInMixfixDecl(json |> field("names", list(name)))
             | "UnknownNamesInFixityDecl" =>
               UnknownNamesInFixityDecl(json |> field("names", list(name)))
             | "UnknownNamesInPolarityPragmas" =>
               UnknownNamesInPolarityPragmas(
                 json |> field("names", list(name)),
               )
             | "UselessAbstract" =>
               UselessAbstract(json |> field("range", Location.range))
             | "UselessInstance" =>
               UselessInstance(json |> field("range", Location.range))
             | "UselessPrivate" =>
               UselessPrivate(json |> field("range", Location.range))
             | _ => failwith("unknown kind of DeclarationWarning")
             }
           );
      let importDirective = CommonPrim.importDirective_(name, name);
      let asName = json => {
        name: json |> field("name", name),
        range: json |> field("range", Location.range),
      };
      let openShortHand =
        string
        |> andThen((kind, _json) =>
             switch (kind) {
             | "DoOpen" => DoOpen
             | "DontOpen" => DontOpen
             | _ => failwith("unknown kind of OpenShortHand")
             }
           );
      let rec expr = () =>
        field("kind", string)
        |> andThen((kind, json) =>
             switch (kind) {
             | "Ident" => Ident(json |> field("name", qname))
             | "Lit" => Lit(json |> field("literal", Literal.literal))
             | "QuestionMark" =>
               QuestionMark(
                 json |> field("range", Location.range),
                 json |> field("index", optional(int)),
               )
             | "Underscore" =>
               Underscore(
                 json |> field("range", Location.range),
                 json |> field("name", optional(string)),
               )
             | "RawApp" =>
               RawApp(
                 json |> field("range", Location.range),
                 json |> field("exprs", list(expr())),
               )
             | "App" =>
               App(
                 json |> field("range", Location.range),
                 json |> field("expr", expr()),
                 json |> field("args", CommonPrim.namedArg(expr())),
               )
             | "OpApp" =>
               OpApp(
                 json |> field("range", Location.range),
                 json |> field("name", qname),
                 json |> field("args", list(CommonPrim.namedArg(opApp()))),
               )
             | "WithApp" =>
               WithApp(
                 json |> field("range", Location.range),
                 json |> field("expr", expr()),
                 json |> field("exprs", list(expr())),
               )
             | "HiddenArg" =>
               HiddenArg(
                 json |> field("range", Location.range),
                 json |> field("expr", CommonPrim.named(expr())),
               )
             | "InstanceArg" =>
               InstanceArg(
                 json |> field("range", Location.range),
                 json |> field("expr", CommonPrim.named(expr())),
               )
             | "Lam" =>
               Lam(
                 json |> field("range", Location.range),
                 json |> field("bindings", list(lamBinding())),
                 json |> field("expr", expr()),
               )
             | "AbsurdLam" =>
               AbsurdLam(
                 json |> field("range", Location.range),
                 json |> field("hiding", CommonPrim.hiding),
               )
             | "ExtendedLam" =>
               ExtendedLam(
                 json |> field("range", Location.range),
                 json |> field("clauses", list(lamBinding())),
               )
             | "Fun" =>
               Fun(
                 json |> field("range", Location.range),
                 json |> field("arg", CommonPrim.arg(expr())),
                 json |> field("expr", expr()),
               )
             | "Pi" =>
               Pi(
                 json |> field("telescope", telescope),
                 json |> field("expr", expr()),
               )
             | "Set" => Set(json |> field("range", Location.range))
             | "Prop" => Prop(json |> field("range", Location.range))
             | "SetN" =>
               SetN(
                 json |> field("range", Location.range),
                 json |> field("level", int),
               )
             | "PropN" =>
               PropN(
                 json |> field("range", Location.range),
                 json |> field("level", int),
               )
             | "Rec" =>
               Rec(
                 json |> field("range", Location.range),
                 json |> field("assignments", list(recordAssignment())),
               )
             | "RecUpdate" =>
               RecUpdate(
                 json |> field("range", Location.range),
                 json |> field("expr", expr()),
                 json |> field("assignments", list(fieldAssignmentExpr)),
               )
             | "Let" =>
               Let(
                 json |> field("range", Location.range),
                 json |> field("declarations", list(declaration())),
                 json |> field("expr", optional(expr())),
               )
             | "Paren" =>
               Paren(
                 json |> field("range", Location.range),
                 json |> field("expr", expr()),
               )
             | "IdiomBrackets" =>
               IdiomBrackets(
                 json |> field("range", Location.range),
                 json |> field("expr", expr()),
               )
             | "DoBlock" =>
               DoBlock(
                 json |> field("range", Location.range),
                 json |> field("dostmts", list(doStmt())),
               )
             | _ => failwith("unknown kind of Expr")
             }
           )
      and declaration = () =>
        field("kind", string)
        |> andThen((kind, json) =>
             switch (kind) {
             | "TypeSig" =>
               TypeSig(
                 json |> field("argInfo", CommonPrim.argInfo),
                 json |> field("name", name),
                 json |> field("expr", expr()),
               )
             | "Generalize" =>
               Generalize(
                 json |> field("argInfo", CommonPrim.argInfo),
                 json |> field("name", name),
                 json |> field("expr", expr()),
               )
             | "Field" =>
               Field(
                 json |> field("isInstance", CommonPrim.isInstance),
                 json |> field("name", name),
                 json |> field("arg", CommonPrim.arg(expr())),
               )
             | "FunClause" =>
               FunClause(
                 json |> field("LHS", lhs),
                 json |> field("RHS", rhs()),
                 json |> field("whereClause", whereClause()),
                 json |> field("catchAll", bool),
               )
             | "DataSig" =>
               DataSig(
                 json |> field("range", Location.range),
                 json |> field("induction", CommonPrim.induction),
                 json |> field("name", name),
                 json |> field("bindings", list(lamBinding())),
                 json |> field("expr", expr()),
               )
             | "Data" =>
               Data(
                 json |> field("range", Location.range),
                 json |> field("induction", CommonPrim.induction),
                 json |> field("name", name),
                 json |> field("bindings", list(lamBinding())),
                 json |> field("expr", optional(expr())),
                 json |> field("declarations", list(declaration())),
               )
             | "RecordSig" =>
               RecordSig(
                 json |> field("range", Location.range),
                 json |> field("name", name),
                 json |> field("bindings", list(lamBinding())),
                 json |> field("expr", expr()),
               )
             | "Record" =>
               Record(
                 json |> field("range", Location.range),
                 json |> field("name", name),
                 json
                 |> field(
                      "induction",
                      optional(CommonPrim.ranged(CommonPrim.induction)),
                    ),
                 json |> field("hasEta", optional(CommonPrim.hasEta)),
                 json
                 |> field(
                      "instancePairs",
                      optional(pair(name, CommonPrim.isInstance)),
                    ),
                 json |> field("bindings", list(lamBinding())),
                 json |> field("expr", optional(expr())),
                 json |> field("declarations", list(declaration())),
               )
             | "Infix" =>
               Infix(
                 json |> field("fixity", Fixity.fixity),
                 json |> field("names", list(name)),
               )
             | "Syntax" =>
               Syntax(
                 json |> field("name", name),
                 json |> field("notation", Notation.notation),
               )
             | "PatternSyn" =>
               PatternSyn(
                 json |> field("range", Location.range),
                 json |> field("name", name),
                 json |> field("args", list(CommonPrim.arg(name))),
                 json |> field("pattern", pattern()),
               )
             | "Mutual" =>
               Mutual(
                 json |> field("range", Location.range),
                 json |> field("declarations", list(declaration())),
               )
             | "Abstract" =>
               Abstract(
                 json |> field("range", Location.range),
                 json |> field("declarations", list(declaration())),
               )
             | "Private" =>
               Private(
                 json |> field("range", Location.range),
                 json |> field("origin", CommonPrim.origin),
                 json |> field("declarations", list(declaration())),
               )
             | "InstanceB" =>
               InstanceB(
                 json |> field("range", Location.range),
                 json |> field("declarations", list(declaration())),
               )
             | "Macro" =>
               Macro(
                 json |> field("range", Location.range),
                 json |> field("declarations", list(declaration())),
               )
             | "Postulate" =>
               Postulate(
                 json |> field("range", Location.range),
                 json |> field("declarations", list(declaration())),
               )
             | "Primitive" =>
               Primitive(
                 json |> field("range", Location.range),
                 json |> field("declarations", list(declaration())),
               )
             | "Open" =>
               Open(
                 json |> field("range", Location.range),
                 json |> field("name", qname),
                 json |> field("importDirective", importDirective),
               )
             | "Import" =>
               Import(
                 json |> field("range", Location.range),
                 json |> field("name", qname),
                 json |> field("asName", optional(asName)),
                 json |> field("openShortHand", openShortHand),
                 json |> field("importDirective", importDirective),
               )
             | "ModuleMacro" =>
               ModuleMacro(
                 json |> field("range", Location.range),
                 json |> field("name", name),
                 json |> field("moduleApp", moduleApplication()),
                 json |> field("openShortHand", openShortHand),
                 json |> field("importDirective", importDirective),
               )
             | "Module" =>
               Module(
                 json |> field("range", Location.range),
                 json |> field("name", qname),
                 json |> field("bindings", telescope),
                 json |> field("declarations", list(declaration())),
               )
             | "UnquoteDecl" =>
               UnquoteDecl(
                 json |> field("range", Location.range),
                 json |> field("names", list(name)),
                 json |> field("expr", expr()),
               )
             | "UnquoteUnquoteDefDecl" =>
               UnquoteUnquoteDefDecl(
                 json |> field("range", Location.range),
                 json |> field("names", list(name)),
                 json |> field("expr", expr()),
               )
             | "Pragma" => Pragma(json |> field("pragma", pragma()))
             | _ => failwith("unknown kind of Declaration")
             }
           )
      and pragma = () =>
        field("kind", string)
        |> andThen((kind, json) =>
             switch (kind) {
             | "OptionsPragma" =>
               OptionsPragma(
                 json |> field("range", Location.range),
                 json |> field("options", list(string)),
               )
             | "BuiltinPragma" =>
               BuiltinPragma(
                 json |> field("range", Location.range),
                 json |> field("entity", string),
                 json |> field("name", qname),
                 json |> field("fixity", Fixity.fixity2),
               )
             | "RewritePragma" =>
               RewritePragma(
                 json |> field("range", Location.range),
                 json |> field("names", list(qname)),
               )
             | "CompiledDataPragma" =>
               CompiledDataPragma(
                 json |> field("range", Location.range),
                 json |> field("name", qname),
                 json |> field("data", string),
                 json |> field("constructors", list(string)),
               )
             | "CompiledTypePragma" =>
               CompiledTypePragma(
                 json |> field("range", Location.range),
                 json |> field("name", qname),
                 json |> field("type", string),
               )
             | "CompiledPragma" =>
               CompiledPragma(
                 json |> field("range", Location.range),
                 json |> field("name", qname),
                 json |> field("haskell", string),
               )
             | "CompiledExportPragma" =>
               CompiledExportPragma(
                 json |> field("range", Location.range),
                 json |> field("name", qname),
                 json |> field("export", string),
               )
             | "CompiledJSPragma" =>
               CompiledJSPragma(
                 json |> field("range", Location.range),
                 json |> field("name", qname),
                 json |> field("js", string),
               )
             | "CompiledUHCPragma" =>
               CompiledUHCPragma(
                 json |> field("range", Location.range),
                 json |> field("name", qname),
                 json |> field("uhc", string),
               )
             | "CompiledDataUHCPragma" =>
               CompiledDataUHCPragma(
                 json |> field("range", Location.range),
                 json |> field("name", qname),
                 json |> field("data", string),
                 json |> field("constructors", list(string)),
               )
             | "HaskellCodePragma" =>
               HaskellCodePragma(
                 json |> field("range", Location.range),
                 json |> field("code", string),
               )
             | "ForeignPragma" =>
               ForeignPragma(
                 json |> field("range", Location.range),
                 json |> field("backend", string),
                 json |> field("code", string),
               )
             | "CompilePragma" =>
               CompilePragma(
                 json |> field("range", Location.range),
                 json |> field("backend", string),
                 json |> field("name", qname),
                 json |> field("code", string),
               )
             | "StaticPragma" =>
               StaticPragma(
                 json |> field("range", Location.range),
                 json |> field("name", qname),
               )
             | "InjectivePragma" =>
               InjectivePragma(
                 json |> field("range", Location.range),
                 json |> field("name", qname),
               )
             | "InlinePragma" =>
               InlinePragma(
                 json |> field("range", Location.range),
                 json |> field("inline", bool),
                 json |> field("name", qname),
               )
             | "ImportPragma" =>
               ImportPragma(
                 json |> field("range", Location.range),
                 json |> field("module", string),
               )
             | "ImportUHCPragma" =>
               ImportUHCPragma(
                 json |> field("range", Location.range),
                 json |> field("module", string),
               )
             | "ImpossiblePragma" =>
               ImpossiblePragma(json |> field("range", Location.range))
             | "EtaPragma" =>
               EtaPragma(
                 json |> field("range", Location.range),
                 json |> field("name", qname),
               )
             | "TerminationCheckPragma" =>
               TerminationCheckPragma(
                 json |> field("range", Location.range),
                 json |> field("name", CommonPrim.terminationCheck(name)),
               )
             | "WarningOnUsage" =>
               WarningOnUsage(
                 json |> field("range", Location.range),
                 json |> field("name", qname),
                 json |> field("warning", string),
               )
             | "CatchallPragma" =>
               CatchallPragma(json |> field("range", Location.range))
             | "DisplayPragma" =>
               DisplayPragma(
                 json |> field("range", Location.range),
                 json |> field("pattern", pattern()),
                 json |> field("expr", expr()),
               )
             | "NoPositivityCheckPragma" =>
               NoPositivityCheckPragma(
                 json |> field("range", Location.range),
               )
             | "PolarityPragma" =>
               PolarityPragma(
                 json |> field("range", Location.range),
                 json |> field("name", name),
                 json
                 |> field(
                      "occurrences",
                      list(TypeCheckingPositivity.occurrence),
                    ),
               )
             | "NoUniverseCheckPragma" =>
               NoUniverseCheckPragma(json |> field("range", Location.range))
             | _ => failwith("unknown kind of Pragma")
             }
           )
      and moduleApplication = () =>
        field("kind", string)
        |> andThen((kind, json) =>
             switch (kind) {
             | "SectionApp" =>
               SectionApp(
                 json |> field("range", Location.range),
                 json |> field("bindings", telescope),
                 json |> field("expr", expr()),
               )
             | "RecordModuleIFS" =>
               RecordModuleIFS(
                 json |> field("range", Location.range),
                 json |> field("name", qname),
               )
             | _ => failwith("unknown kind of ModuleApplication")
             }
           )
      and fieldAssignmentExpr: decoder(fieldAssignmentExpr) =
        json => {
          name: json |> field("name", name),
          value: json |> field("value", expr()),
        }
      /* Ocaml/Reason bug */
      and fieldAssignmentPattern: decoder(fieldAssignmentPattern) =
        json => {
          name: json |> field("name", name),
          value: json |> field("value", pattern()),
        }
      and moduleAssignment = json => {
        name: json |> field("name", qname),
        exprs: json |> field("exprs", list(expr())),
        importDirective: json |> field("importDirective", importDirective),
      }
      and recordAssignment = () =>
        either(
          json =>
            Type.Syntax.Concrete.FieldAssignment(
              json |> field("Left", fieldAssignmentExpr),
            ),
          json =>
            Type.Syntax.Concrete.ModuleAssignment(
              json |> field("Right", moduleAssignment),
            ),
        )
      and whereClause_ = decoder =>
        field("kind", string)
        |> andThen((kind, json) =>
             switch (kind) {
             | "SomeWhere" =>
               SomeWhere(
                 json |> field("name", name),
                 json |> field("access", CommonPrim.access),
                 json |> field("declarations", decoder),
               )
             | "NoWhere" => NoWhere
             | "AnyWhere" => AnyWhere(json |> field("declarations", decoder))
             | _ => failwith("unknown kind of OpApp")
             }
           )
      and whereClause = () => whereClause_(list(declaration()))
      and opApp = () =>
        field("kind", string)
        |> andThen((kind, json) =>
             switch (kind) {
             | "Placeholder" =>
               Placeholder(
                 json |> field("position", CommonPrim.positionInName),
               )
             | "NoPlaceholder" =>
               let position =
                 json
                 |> field("position", optional(CommonPrim.positionInName));
               let kind = json |> at(["value", "kind"], string);
               switch (kind) {
               | "SyntaxBindingLambda" =>
                 SyntaxBindingLambda(
                   position,
                   json |> at(["value", "range"], Location.range),
                   json |> at(["value", "binding"], list(lamBinding())),
                   json |> at(["value", "value"], expr()),
                 )
               | "Ordinary" =>
                 Ordinary(position, json |> at(["value", "value"], expr()))
               | _ => failwith("unknown kind of OpApp")
               };
             | _ => failwith("unknown kind of OpApp")
             }
           )
      and typedBinding = () =>
        field("kind", string)
        |> andThen((kind, json) =>
             switch (kind) {
             | "TBind" =>
               TBind(
                 json |> field("range", Location.range),
                 json
                 |> field(
                      "bindings",
                      list(CommonPrim.withHiding(boundName)),
                    ),
                 json |> field("value", expr()),
               )
             | "TLet" =>
               TLet(
                 json |> field("range", Location.range),
                 json |> field("declarations", list(declaration())),
               )
             | _ => failwith("unknown kind of TypedBinding_")
             }
           )
      and typedBindings = json =>
        TypedBindings(
          json |> field("range", Location.range),
          json |> field("arg", CommonPrim.arg(typedBinding())),
        )
      and lamBinding = () =>
        field("kind", string)
        |> andThen((kind, json) =>
             switch (kind) {
             | "DomainFree" =>
               DomainFree(
                 json |> field("argInfo", CommonPrim.argInfo),
                 json |> field("name", boundName),
               )
             | "DomainFull" =>
               DomainFull(json |> field("value", typedBindings))
             | _ => failwith("unknown kind of LamBinding_")
             }
           )
      and telescope = json => Telescope(json |> list(typedBindings))
      and pattern: unit => decoder(pattern) =
        () =>
          field("kind", string)
          |> andThen((kind, json) =>
               switch (kind) {
               | "IdentP" => IdentP(json |> field("name", qname))
               | "QuoteP" => QuoteP(json |> field("range", Location.range))
               | "AppP" =>
                 AppP(
                   json |> field("pattern", pattern()),
                   json |> field("arg", CommonPrim.namedArg(pattern())),
                 )
               | "RawAppP" =>
                 RawAppP(
                   json |> field("range", Location.range),
                   json |> field("patterns", list(pattern())),
                 )
               | "OpAppP" =>
                 OpAppP(
                   json |> field("range", Location.range),
                   json |> field("name", qname),
                   json
                   |> field("args", list(CommonPrim.namedArg(pattern()))),
                 )
               | "HiddenP" =>
                 HiddenP(
                   json |> field("range", Location.range),
                   json |> field("pattern", CommonPrim.named(pattern())),
                 )
               | "InstanceP" =>
                 InstanceP(
                   json |> field("range", Location.range),
                   json |> field("pattern", CommonPrim.named(pattern())),
                 )
               | "ParenP" =>
                 ParenP(
                   json |> field("range", Location.range),
                   json |> field("pattern", pattern()),
                 )
               | "WildP" => WildP(json |> field("range", Location.range))
               | "AbsurdP" => AbsurdP(json |> field("range", Location.range))
               | "AsP" =>
                 AsP(
                   json |> field("range", Location.range),
                   json |> field("name", name),
                   json |> field("pattern", pattern()),
                 )
               | "DotP" =>
                 DotP(
                   json |> field("range", Location.range),
                   json |> field("expr", expr()),
                 )
               | "LitP" => LitP(json |> field("literal", Literal.literal))
               | "RecP" =>
                 RecP(
                   json |> field("range", Location.range),
                   json |> field("assignments", list(fieldAssignmentPattern)),
                 )
               | "EqualP" =>
                 EqualP(
                   json |> field("range", Location.range),
                   json |> field("pairs", list(pair(expr(), expr()))),
                 )
               | "EllipsisP" =>
                 EllipsisP(json |> field("range", Location.range))
               | "WithP" =>
                 WithP(
                   json |> field("range", Location.range),
                   json |> field("pattern", pattern()),
                 )
               | _ => failwith("unknown kind of Pattern")
               }
             )
      and doStmt = () =>
        field("kind", string)
        |> andThen((kind, json) =>
             switch (kind) {
             | "DoBind" =>
               DoBind(
                 json |> field("range", Location.range),
                 json |> field("pattern", pattern()),
                 json |> field("expr", expr()),
                 json |> field("clauses", list(lamClause)),
               )
             | "DoThen" => DoThen(json |> field("expr", expr()))
             | "DoLet" =>
               DoLet(
                 json |> field("range", Location.range),
                 json |> field("declarations", list(declaration())),
               )
             | _ => failwith("unknown kind of DoStmt")
             }
           )
      and lhs = json => {
        originalPattern: json |> field("originalPattern", pattern()),
        rewriteEqn: json |> field("rewriteEqn", list(expr())),
        withExpr: json |> field("withExpr", list(expr())),
      }
      and rhs_ = decoder =>
        field("kind", string)
        |> andThen((kind, json) =>
             switch (kind) {
             | "AbsurdRHS" => AbsurdRHS
             | "RHS" => RHS(json |> field("value", decoder))
             | _ => failwith("unknown kind of RHS")
             }
           )
      and rhs = () => rhs_(expr())
      and lamClause = json => {
        lhs: json |> field("LHS", lhs),
        rhs: json |> field("RHS", rhs()),
        whereClause: json |> field("whereClause", whereClause()),
        catchAll: json |> field("catchAll", bool),
      };
      let elimTerm = () =>
        field("kind", string)
        |> andThen((kind, json) =>
             switch (kind) {
             | "Apply" =>
               Apply(json |> field("arg", CommonPrim.arg(expr())))
             | "Proj" =>
               Proj(
                 json |> field("projOrigin", CommonPrim.projOrigin),
                 json |> field("name", qname),
               )
             | "IApply" =>
               IApply(
                 json |> field("endpoint1", expr()),
                 json |> field("endpoint2", expr()),
                 json |> field("endpoint3", expr()),
               )
             | _ => failwith("unknown kind of Elim(Term)")
             }
           );
    };
    module Common = {
      open Type.Syntax.CommonPrim;
      open Type.Syntax.Common;
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
  };
  module TypeChecking = {
    open Location;
    open Type.TypeChecking;
    open Syntax.Name;
    open Syntax.Concrete;
    let comparison =
      string
      |> andThen((kind, _json) =>
           switch (kind) {
           | "CmpLeq" => CmpLeq
           | "CmpEq" => CmpEq
           | _ => failwith("unknown kind of Comparison")
           }
         );
    let call =
      field("kind", string)
      |> andThen((kind, json) =>
           switch (kind) {
           | "CheckClause" =>
             CheckClause(
               json |> field("type", expr()),
               json |> field("clause", list(declaration())),
             )
           | "CheckPattern" =>
             CheckPattern(
               json |> field("pattern", pattern()),
               json |> field("type", expr()),
             )
           | "CheckLetBinding" =>
             CheckLetBinding(json |> field("binding", list(declaration())))
           | "InferExpr" => InferExpr(json |> field("expr", expr()))
           | "CheckExprCall" =>
             CheckExprCall(
               json |> field("comparison", comparison),
               json |> field("expr", expr()),
               json |> field("type", expr()),
             )
           | "CheckDotPattern" =>
             CheckDotPattern(
               json |> field("expr", expr()),
               json |> field("type", expr()),
             )
           | "CheckPatternShadowing" =>
             CheckPatternShadowing(
               json |> field("clause", list(declaration())),
             )
           | "CheckProjection" =>
             CheckProjection(
               json |> field("range", range),
               json |> field("name", qname),
               json |> field("type", expr()),
             )
           | "IsTypeCall" =>
             IsTypeCall(
               json |> field("expr", expr()),
               json |> field("sort", expr()),
             )
           | "IsType_" => IsType_(json |> field("expr", expr()))
           | "InferVar" => InferVar(json |> field("name", name))
           | "InferDef" => InferDef(json |> field("name", qname))
           | "CheckArguments" =>
             CheckArguments(
               json |> field("range", range),
               json
               |> field(
                    "arguments",
                    list(Syntax.CommonPrim.namedArg(expr())),
                  ),
               json |> field("type1", expr()),
             )
           | "CheckTargetType" =>
             CheckTargetType(
               json |> field("range", range),
               json |> field("infType", expr()),
               json |> field("expType", expr()),
             )
           | "CheckDataDef" =>
             CheckDataDef(
               json |> field("range", range),
               json |> field("name", name),
             )
           | "CheckRecDef" =>
             CheckRecDef(
               json |> field("range", range),
               json |> field("name", name),
             )
           | "CheckConstructor" =>
             CheckConstructor(
               json |> field("declarationName", qname),
               json |> field("constructorName", qname),
             )
           | "CheckFunDefCall" =>
             CheckFunDefCall(
               json |> field("range", range),
               json |> field("name", name),
             )
           | "CheckPragma" =>
             CheckPragma(
               json |> field("range", range),
               json |> field("pragma", pragma()),
             )
           | "CheckPrimitive" =>
             CheckPrimitive(
               json |> field("range", range),
               json |> field("name", name),
               json |> field("expr", expr()),
             )
           | "CheckIsEmpty" =>
             CheckIsEmpty(
               json |> field("range", range),
               json |> field("type", expr()),
             )
           | "CheckWithFunctionType" =>
             CheckWithFunctionType(json |> field("expr", expr()))
           | "CheckSectionApplication" =>
             CheckSectionApplication(
               json |> field("range", range),
               json |> field("module", qname),
               json |> field("modApp", list(declaration())),
             )
           | "CheckNamedWhere" =>
             CheckNamedWhere(json |> field("module", qname))
           | "ScopeCheckExpr" =>
             ScopeCheckExpr(json |> field("expr", expr()))
           | "ScopeCheckDeclaration" =>
             ScopeCheckDeclaration(
               json |> field("declarations", list(declaration())),
             )
           | "ScopeCheckLHS" =>
             ScopeCheckLHS(
               json |> field("name", qname),
               json |> field("pattern", pattern()),
             )
           | "NoHighlighting" => NoHighlighting
           | "ModuleContents" => ModuleContents
           | "SetRange" => SetRange(json |> field("range", range))
           | _ => failwith("unknown kind of Call")
           }
         );
    let typeError =
      field("kind", string)
      |> andThen((kind, json) =>
           switch (kind) {
           | "GenericDocError" =>
             GenericDocError(json |> field("message", string))
           | "GenericError" => GenericError(json |> field("message", string))
           | "ShouldEndInApplicationOfTheDatatype" =>
             ShouldEndInApplicationOfTheDatatype(
               json |> field("type", expr()),
             )
           | "ShadowedModule" =>
             ShadowedModule(
               json |> field("previous", qname),
               json |> field("duplicated", name),
               json
               |> field(
                    "dataOrRecord",
                    optional(Syntax.CommonPrim.dataOrRecord),
                  ),
             )
           | "ShouldBePi" => ShouldBePi(json |> field("type", expr()))
           | "ShouldBeASort" => ShouldBeASort(json |> field("type", expr()))
           | "UnequalTerms" =>
             UnequalTerms(
               json |> field("comparison", comparison),
               json |> field("term1", expr()),
               json |> field("term2", expr()),
               json |> field("type", expr()),
               json |> field("reason", string),
             )
           | "ClashingDefinition" =>
             ClashingDefinition(
               json |> field("definition", qname),
               json |> field("previouslyAt", range),
             )
           | "ModuleArityMismatch" =>
             ModuleArityMismatch(
               json |> field("module", qname),
               json |> field("isParameterized", bool),
               json
               |> withDefault(None, json =>
                    Some(json |> field("telescope", telescope))
                  ),
             )
           | "NoRHSRequiresAbsurdPattern" =>
             NoRHSRequiresAbsurdPattern(
               json |> field("patterns", list(pattern())),
             )
           | "NotInScope" =>
             NotInScope(
               json
               |> field(
                    "names",
                    list(json =>
                      (
                        json |> field("name", qname),
                        json |> field("suggestions", list(qname)),
                      )
                    ),
                  ),
             )
           | "NoSuchModule" => NoSuchModule(json |> field("module", qname))
           | "AmbiguousName" =>
             AmbiguousName(
               json |> field("ambiguousName", qname),
               json |> field("couldReferTo", list(qname)),
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
               json |> field("range", range),
               json |> field("call", optional(call)),
               json |> field("typeError", typeError),
             )
           | "Exception" =>
             Exception(
               json |> field("range", range),
               json |> field("message", string),
             )
           | "IOException" =>
             IOException(
               json |> field("range", range),
               json |> field("message", string),
             )
           | "PatternError" => PatternError(json |> field("range", range))
           | _ => failwith("unknown kind of TCError")
           }
         );
    let terminationError = json => {
      functions: json |> field("functions", list(qname)),
      calls: json |> field("calls", list(qname)),
    };
    let polarity =
      string
      |> andThen((kind, _json) =>
           switch (kind) {
           | "Covariant" => Covariant
           | "Contravariant" => Contravariant
           | "Invariant" => Invariant
           | "Nonvariant" => Nonvariant
           | _ => failwith("unknown kind of Polarity")
           }
         );
    let isForced =
      string
      |> andThen((kind, _json) =>
           switch (kind) {
           | "Forced" => Forced
           | "NotForced" => NotForced
           | _ => failwith("unknown kind of IsForced")
           }
         );
    let where =
      field("kind", string)
      |> andThen((kind, json) =>
           switch (kind) {
           | "LeftOfArrow" => LeftOfArrow
           | "DefArg" =>
             DefArg(
               json |> field("name", string),
               json |> field("index", int),
             )
           | "UnderInf" => UnderInf
           | "VarArg" => VarArg
           | "MetaArg" => MetaArg
           | "ConArgType" => ConArgType(json |> field("name", string))
           | "IndArgType" => IndArgType(json |> field("name", string))
           | "InClause" => InClause(json |> field("index", int))
           | "Matched" => Matched
           | "InDefOf" => InDefOf(json |> field("name", string))
           | _ => failwith("unknown kind of Where")
           }
         );
    let occursWhere =
      field("kind", string)
      |> andThen((kind, json) =>
           switch (kind) {
           | "Unknown" => Unknown
           | "Known" =>
             Known(
               json |> field("range", range),
               json |> field("wheres", list(where)),
             )
           | _ => failwith("unknown kind of OccursWhere")
           }
         );
    let explicitToInstance =
      string
      |> andThen((kind, _json) =>
           switch (kind) {
           | "ExplicitToInstance" => ExplicitToInstance
           | "ExplicitStayExplicit" => ExplicitStayExplicit
           | _ => failwith("unknown kind of ExplicitToInstance")
           }
         );
    let candidate = json => {
      term: json |> field("term", expr()),
      type_: json |> field("type", expr()),
      eti: json |> field("eti", explicitToInstance),
      overlappable:
        json |> field("overlappable", Syntax.CommonPrim.overlappable),
    };
    let rec constraint_ = () =>
      field("kind", string)
      |> andThen((kind, json) =>
           switch (kind) {
           | "ValueCmp" =>
             ValueCmp(
               json |> field("comparison", comparison),
               json |> field("type", expr()),
               json |> field("term1", expr()),
               json |> field("term2", expr()),
             )
           | "ValueCmpOnFace" =>
             ValueCmpOnFace(
               json |> field("comparison", comparison),
               json |> field("face", expr()),
               json |> field("type", expr()),
               json |> field("term1", expr()),
               json |> field("term2", expr()),
             )
           | "ElimCmp" =>
             ElimCmp(
               json |> field("polarities", list(polarity)),
               json |> field("isForced", list(isForced)),
               json |> field("type", expr()),
               json |> field("term", expr()),
               json |> field("elims1", list(elimTerm())),
               json |> field("elims2", list(elimTerm())),
             )
           | "TypeCmp" =>
             TypeCmp(
               json |> field("comparison", comparison),
               json |> field("type1", expr()),
               json |> field("type2", expr()),
             )
           | "TelCmp" =>
             TelCmp(
               json |> field("comparison", comparison),
               json |> field("type1", expr()),
               json |> field("type2", expr()),
               json |> field("telescope1", telescope),
               json |> field("telescope2", telescope),
             )
           | "SortCmp" =>
             SortCmp(
               json |> field("comparison", comparison),
               json |> field("sort1", expr()),
               json |> field("sort2", expr()),
             )
           | "LevelCmp" =>
             LevelCmp(
               json |> field("comparison", comparison),
               json |> field("level1", expr()),
               json |> field("level2", expr()),
             )
           | "HasBiggerSort" => HasBiggerSort(json |> field("sort", expr()))
           | "HasPTSRuleNoAbs" =>
             HasPTSRuleNoAbs(
               json |> field("sort", expr()),
               json |> field("binding", expr()),
             )
           | "HasPTSRuleAbs" =>
             HasPTSRuleAbs(
               json |> field("sort", expr()),
               json |> field("binding", expr()),
             )
           | "UnBlock" => UnBlock(json |> field("metaId", int))
           | "Guarded" =>
             Guarded(
               json |> field("constraint", constraint_()),
               json |> field("problemId", int),
             )
           | "IsEmpty" =>
             IsEmpty(
               json |> field("range", range),
               json |> field("type", expr()),
             )
           | "CheckSizeLtSat" =>
             CheckSizeLtSat(json |> field("term", expr()))
           | "FindInScope" =>
             FindInScope(
               json |> field("instanceArg", int),
               json |> field("metaId", optional(int)),
               json |> field("candidates", optional(list(candidate))),
             )
           | "CheckFunDef" =>
             CheckFunDef(
               json |> field("name", qname),
               json |> field("declarations", list(list(declaration()))),
             )
           | _ => failwith("unknown kind of Constraint")
           }
         );
    let problemConstraint = json => {
      problems: json |> field("problems", array(int)),
      constraint_: json |> field("constraint", constraint_()),
    };
    let warning =
      field("kind", string)
      |> andThen((kind, json) =>
           switch (kind) {
           | "NicifierIssue" =>
             NicifierIssue(
               json |> field("declarationWarning", declarationWarning),
             )
           | "TerminationIssue" =>
             TerminationIssue(
               json |> field("terminationErrors", list(terminationError)),
             )
           | "UnreachableClauses" =>
             UnreachableClauses(json |> field("name", qname))
           | "CoverageIssue" =>
             CoverageIssue(
               json |> field("name", qname),
               json |> field("declarations", list(list(declaration()))),
             )
           | "CoverageNoExactSplit" =>
             CoverageNoExactSplit(
               json |> field("name", qname),
               json |> field("declarations", list(list(declaration()))),
             )
           | "UnsolvedMetaVariables" =>
             UnsolvedMetaVariables(json |> field("ranges", list(range)))
           | "UnsolvedInteractionMetas" =>
             UnsolvedInteractionMetas(json |> field("ranges", list(range)))
           | "UnsolvedConstraints" =>
             UnsolvedConstraints(
               json |> field("constraints", list(problemConstraint)),
             )
           | "AbsurdPatternRequiresNoRHS" => AbsurdPatternRequiresNoRHS
           | "OldBuiltin" =>
             OldBuiltin(
               json |> field("old", string),
               json |> field("new", string),
             )
           | "EmptyRewritePragma" => EmptyRewritePragma
           | "UselessPublic" => UselessPublic
           | "UselessInline" => UselessInline(json |> field("name", qname))
           | "InversionDepthReached" =>
             InversionDepthReached(json |> field("name", qname))
           | "GenericWarning" =>
             GenericWarning(json |> field("warning", string))
           | "GenericNonFatalError" =>
             GenericNonFatalError(json |> field("message", string))
           | "SafeFlagPostulate" =>
             SafeFlagPostulate(json |> field("name", name))
           | "SafeFlagPragma" =>
             SafeFlagPragma(json |> field("pragmas", list(string)))
           | "SafeFlagNonTerminating" => SafeFlagNonTerminating
           | "SafeFlagTerminating" => SafeFlagTerminating
           | "SafeFlagPrimTrustMe" => SafeFlagPrimTrustMe
           | "SafeFlagNoPositivityCheck" => SafeFlagNoPositivityCheck
           | "SafeFlagPolarity" => SafeFlagPolarity
           | "SafeFlagNoUniverseCheck" => SafeFlagNoUniverseCheck
           | "ParseWarning" =>
             ParseWarning(
               json |> field("warning", Syntax.Parser.parseWarning),
             )
           | "DeprecationWarning" =>
             DeprecationWarning(
               json |> field("old", string),
               json |> field("new", string),
               json |> field("version", string),
             )
           | "UserWarning" => UserWarning(json |> field("warning", string))
           | "ModuleDoesntExport" =>
             ModuleDoesntExport(
               json |> field("sourceModule", qname),
               json
               |> field(
                    "warning",
                    list(
                      Syntax.CommonPrim.importedName_(qname, list(name)),
                    ),
                  ),
             )
           | _ => failwith("unknown kind of Warning")
           }
         );
    let tcWarning = json => {
      cached: json |> field("cached", bool),
      range: json |> field("range", range),
      /* warning: json |> field("warning", warning), */
      warning': json |> field("warning'", string),
    };
  };
  module Interaction = {
    open Type.View.JSON;
    let rec outputConstraint = (decoderA, decoderB) =>
      field("kind", string)
      |> andThen((kind, json) =>
           switch (kind) {
           | "OfType" =>
             OfType(
               json |> field("term", decoderB),
               json |> field("type", decoderA),
             )
           | "CmpInType" =>
             CmpInType(
               json |> field("comparison", TypeChecking.comparison),
               json |> field("term1", decoderB),
               json |> field("term2", decoderB),
               json |> field("type", decoderA),
             )
           | "CmpElim" =>
             CmpElim(
               json |> field("type", decoderA),
               json |> field("terms1", list(decoderB)),
               json |> field("terms2", list(decoderB)),
             )
           | "JustType" => JustType(json |> field("type", decoderB))
           | "CmpTypes" =>
             CmpTypes(
               json |> field("comparison", TypeChecking.comparison),
               json |> field("type1", decoderB),
               json |> field("type2", decoderB),
             )
           | "CmpLevels" =>
             CmpLevels(
               json |> field("comparison", TypeChecking.comparison),
               json |> field("level1", decoderB),
               json |> field("level2", decoderB),
             )
           | "CmpTeles" =>
             CmpTeles(
               json |> field("comparison", TypeChecking.comparison),
               json |> field("level1", decoderB),
               json |> field("level2", decoderB),
             )
           | "JustSort" => JustSort(json |> field("sort", decoderB))
           | "CmpSorts" =>
             CmpSorts(
               json |> field("comparison", TypeChecking.comparison),
               json |> field("sort1", decoderB),
               json |> field("sort2", decoderB),
             )
           | "Guard" =>
             Guard(
               json
               |> field(
                    "outputConstraint",
                    outputConstraint(decoderA, decoderB),
                  ),
               json |> field("problemId", int),
             )
           | "Assign" =>
             Assign(
               json |> field("LHS", decoderB),
               json |> field("RHS", decoderA),
             )
           | "TypedAssign" =>
             TypedAssign(
               json |> field("LHS", decoderB),
               json |> field("RHS", decoderA),
               json |> field("type", decoderA),
             )
           | "PostponedCheckArgs" =>
             PostponedCheckArgs(
               json |> field("LHS", decoderB),
               json |> field("exprs", list(decoderA)),
               json |> field("type1", decoderA),
               json |> field("type2", decoderA),
             )
           | "IsEmptyType" => IsEmptyType(json |> field("type", decoderA))
           | "SizeLtSat" => SizeLtSat(json |> field("size", decoderA))
           | "FindInScopeOF" =>
             FindInScopeOF(
               json |> field("term", decoderB),
               json |> field("type", decoderA),
               json |> field("candidates", list(pair(decoderA, decoderA))),
             )
           | "PTSInstance" =>
             PTSInstance(
               json |> field("a", decoderB),
               json |> field("b", decoderB),
             )
           | _ => failwith("unknown kind of OutputConstraint")
           }
         );
    let allGoalsWarnings = json => {
      interactionMetas:
        json
        |> field(
             "interactionMetas",
             list(
               outputConstraint(
                 Syntax.Concrete.expr(),
                 Syntax.Concrete.expr(),
               ),
             ),
           ),
      hiddenMetas:
        json
        |> field(
             "hiddenMetas",
             list(
               outputConstraint(
                 Syntax.Concrete.expr(),
                 Syntax.Concrete.expr(),
               ),
             ),
           ),
      warnings: json |> field("warnings", list(TypeChecking.tcWarning)),
      errors: json |> field("warnings", list(TypeChecking.tcWarning)),
    };
  };
};

open Type.View.JSON;

let parseError = Decode.TypeChecking.error;

let parseBody = (raw: rawBody) =>
  switch (raw.kind) {
  | "AllGoalsWarnings" =>
    AllGoalsWarnings(raw.rawJSON |> Decode.Interaction.allGoalsWarnings)
  | "Error" =>
    ErrorMessage(raw.rawJSON |> Decode.TypeChecking.error, raw.rawString)
  | "PlainText" => PlainText(raw.rawString)
  | _ => failwith("unknown kind of Body")
  };
