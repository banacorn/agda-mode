[%%debugger.chrome];

module Decode = {
  open Json.Decode;
  module TypeCheckingPositivity = {
    open Type.TypeCheckingPositivity;
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
  module Syntax = {
    module Position = {
      open Type.Syntax.Position;
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
    module C = {
      open Type.Syntax.C;
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
      let qName =
        list(name)
        |> andThen((names, _) => QName(List.tl(names), List.hd(names)));
    };
    module CommonPrim = {
      open Type.Syntax.CommonPrim;
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
        range: json |> field("range", Position.range),
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
        range: json |> field("range", Position.range),
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
                 json |> field("range", Position.range),
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
          json |> field("range", Position.range),
          json |> field("value", decoder),
        );
      let named = (nameDecoder, valueDecoder, json) =>
        Named(
          json |> field("name", optional(nameDecoder)),
          json |> field("value", valueDecoder),
        );
      let named_ = decoder => named(ranged(string), decoder);
      let namedArg = decoder => arg(named_(decoder));
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
        range: json |> field("range", Position.range),
        level: json |> field("level", precedenceLevel),
        assoc: json |> field("assoc", associativity),
      };
      let fixity2 = json => {
        fixity: json |> field("fixity", fixity),
        notation: json |> field("notation", Notation.notation),
        range: json |> field("range", Position.range),
      };
    };
    module Abstract = {
      open Type.Syntax.Abstract;
      let rec name = json => {
        nameId: json |> field("id", C.nameId),
        concrete: json |> field("concrete", C.name),
        bindingSite: json |> field("bindingSite", Position.range),
        fixity: json |> field("fixity", Fixity.fixity2),
      };
      let qName = json =>
        QName(
          json |> field("module", list(name)),
          json |> field("name", name),
        );
    };
    module Literal = {
      open Type.Syntax.Literal;
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
    module Concrete = {
      open Type.Syntax.C;
      open Type.Syntax.Concrete;
      let importDirective = CommonPrim.importDirective_(C.name, C.name);
      let asName = json => {
        name: json |> field("name", C.name),
        range: json |> field("range", Position.range),
      };
      let boundName = json => {
        name: json |> field("name", C.name),
        label: json |> field("label", C.name),
        fixity: json |> field("fixity", Fixity.fixity2),
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
             | "Ident" => Ident(json |> field("name", C.qName))
             | "Lit" => Lit(json |> field("literal", Literal.literal))
             | "QuestionMark" =>
               QuestionMark(
                 json |> field("range", Position.range),
                 json |> field("index", optional(int)),
               )
             | "Underscore" =>
               Underscore(
                 json |> field("range", Position.range),
                 json |> field("name", optional(string)),
               )
             | "RawApp" =>
               RawApp(
                 json |> field("range", Position.range),
                 json |> field("exprs", list(expr())),
               )
             | "App" =>
               App(
                 json |> field("range", Position.range),
                 json |> field("expr", expr()),
                 json |> field("args", CommonPrim.namedArg(expr())),
               )
             | "OpApp" =>
               OpApp(
                 json |> field("range", Position.range),
                 json |> field("name", C.qName),
                 json |> field("names", array(Abstract.name)),
                 json |> field("args", list(CommonPrim.namedArg(opApp()))),
               )
             | "WithApp" =>
               WithApp(
                 json |> field("range", Position.range),
                 json |> field("expr", expr()),
                 json |> field("exprs", list(expr())),
               )
             | "HiddenArg" =>
               HiddenArg(
                 json |> field("range", Position.range),
                 json |> field("expr", CommonPrim.named_(expr())),
               )
             | "InstanceArg" =>
               InstanceArg(
                 json |> field("range", Position.range),
                 json |> field("expr", CommonPrim.named_(expr())),
               )
             | "Lam" =>
               Lam(
                 json |> field("range", Position.range),
                 json |> field("bindings", list(lamBinding())),
                 json |> field("expr", expr()),
               )
             | "AbsurdLam" =>
               AbsurdLam(
                 json |> field("range", Position.range),
                 json |> field("hiding", CommonPrim.hiding),
               )
             | "ExtendedLam" =>
               ExtendedLam(
                 json |> field("range", Position.range),
                 json |> field("clauses", list(lamBinding())),
               )
             | "Fun" =>
               Fun(
                 json |> field("range", Position.range),
                 json |> field("arg", CommonPrim.arg(expr())),
                 json |> field("expr", expr()),
               )
             | "Pi" =>
               Pi(
                 json |> field("telescope", telescope()),
                 json |> field("expr", expr()),
               )
             | "Set" => Set(json |> field("range", Position.range))
             | "Prop" => Prop(json |> field("range", Position.range))
             | "SetN" =>
               SetN(
                 json |> field("range", Position.range),
                 json |> field("level", int),
               )
             | "PropN" =>
               PropN(
                 json |> field("range", Position.range),
                 json |> field("level", int),
               )
             | "Rec" =>
               Rec(
                 json |> field("range", Position.range),
                 json |> field("assignments", list(recordAssignment())),
               )
             | "RecUpdate" =>
               RecUpdate(
                 json |> field("range", Position.range),
                 json |> field("expr", expr()),
                 json |> field("assignments", list(fieldAssignmentExpr)),
               )
             | "Let" =>
               Let(
                 json |> field("range", Position.range),
                 json |> field("declarations", list(declaration())),
                 json |> field("expr", optional(expr())),
               )
             | "Paren" =>
               Paren(
                 json |> field("range", Position.range),
                 json |> field("expr", expr()),
               )
             | "IdiomBrackets" =>
               IdiomBrackets(
                 json |> field("range", Position.range),
                 json |> field("expr", expr()),
               )
             | "DoBlock" =>
               DoBlock(
                 json |> field("range", Position.range),
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
                 json |> field("name", C.name),
                 json |> field("expr", expr()),
               )
             | "Generalize" =>
               Generalize(
                 json |> field("argInfo", CommonPrim.argInfo),
                 json |> field("name", C.name),
                 json |> field("expr", expr()),
               )
             | "Field" =>
               Field(
                 json |> field("isInstance", CommonPrim.isInstance),
                 json |> field("name", C.name),
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
                 json |> field("range", Position.range),
                 json |> field("induction", CommonPrim.induction),
                 json |> field("name", C.name),
                 json |> field("bindings", list(lamBinding())),
                 json |> field("expr", expr()),
               )
             | "Data" =>
               Data(
                 json |> field("range", Position.range),
                 json |> field("induction", CommonPrim.induction),
                 json |> field("name", C.name),
                 json |> field("bindings", list(lamBinding())),
                 json |> field("expr", optional(expr())),
                 json |> field("declarations", list(declaration())),
               )
             | "RecordSig" =>
               RecordSig(
                 json |> field("range", Position.range),
                 json |> field("name", C.name),
                 json |> field("bindings", list(lamBinding())),
                 json |> field("expr", expr()),
               )
             | "Record" =>
               Record(
                 json |> field("range", Position.range),
                 json |> field("name", C.name),
                 json
                 |> field(
                      "induction",
                      optional(CommonPrim.ranged(CommonPrim.induction)),
                    ),
                 json |> field("hasEta", optional(CommonPrim.hasEta)),
                 json
                 |> field(
                      "instancePairs",
                      optional(pair(C.name, CommonPrim.isInstance)),
                    ),
                 json |> field("bindings", list(lamBinding())),
                 json |> field("expr", optional(expr())),
                 json |> field("declarations", list(declaration())),
               )
             | "Infix" =>
               Infix(
                 json |> field("fixity", Fixity.fixity),
                 json |> field("names", list(C.name)),
               )
             | "Syntax" =>
               Syntax(
                 json |> field("name", C.name),
                 json |> field("notation", Notation.notation),
               )
             | "PatternSyn" =>
               PatternSyn(
                 json |> field("range", Position.range),
                 json |> field("name", C.name),
                 json |> field("args", list(CommonPrim.arg(C.name))),
                 json |> field("pattern", pattern()),
               )
             | "Mutual" =>
               Mutual(
                 json |> field("range", Position.range),
                 json |> field("declarations", list(declaration())),
               )
             | "Abstract" =>
               Abstract(
                 json |> field("range", Position.range),
                 json |> field("declarations", list(declaration())),
               )
             | "Private" =>
               Private(
                 json |> field("range", Position.range),
                 json |> field("origin", CommonPrim.origin),
                 json |> field("declarations", list(declaration())),
               )
             | "InstanceB" =>
               InstanceB(
                 json |> field("range", Position.range),
                 json |> field("declarations", list(declaration())),
               )
             | "Macro" =>
               Macro(
                 json |> field("range", Position.range),
                 json |> field("declarations", list(declaration())),
               )
             | "Postulate" =>
               Postulate(
                 json |> field("range", Position.range),
                 json |> field("declarations", list(declaration())),
               )
             | "Primitive" =>
               Primitive(
                 json |> field("range", Position.range),
                 json |> field("typeSigs", list(declaration())),
               )
             | "Open" =>
               Open(
                 json |> field("range", Position.range),
                 json |> field("name", C.qName),
                 json |> field("importDirective", importDirective),
               )
             | "Import" =>
               Import(
                 json |> field("range", Position.range),
                 json |> field("name", C.qName),
                 json |> field("asName", optional(asName)),
                 json |> field("openShortHand", openShortHand),
                 json |> field("importDirective", importDirective),
               )
             | "ModuleMacro" =>
               ModuleMacro(
                 json |> field("range", Position.range),
                 json |> field("name", C.name),
                 json |> field("moduleApplication", moduleApplication()),
                 json |> field("openShortHand", openShortHand),
                 json |> field("importDirective", importDirective),
               )
             | "Module" =>
               Module(
                 json |> field("range", Position.range),
                 json |> field("name", C.qName),
                 json |> field("bindings", list(typedBindings)),
                 json |> field("declarations", list(declaration())),
               )
             | "UnquoteDecl" =>
               UnquoteDecl(
                 json |> field("range", Position.range),
                 json |> field("names", list(C.name)),
                 json |> field("expr", expr()),
               )
             | "UnquoteUnquoteDefDecl" =>
               UnquoteUnquoteDefDecl(
                 json |> field("range", Position.range),
                 json |> field("names", list(C.name)),
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
                 json |> field("range", Position.range),
                 json |> field("options", list(string)),
               )
             | "BuiltinPragma" =>
               BuiltinPragma(
                 json |> field("range", Position.range),
                 json |> field("entity", string),
                 json |> field("name", C.qName),
                 json |> field("fixity", Fixity.fixity2),
               )
             | "RewritePragma" =>
               RewritePragma(
                 json |> field("range", Position.range),
                 json |> field("names", list(C.qName)),
               )
             | "CompiledDataPragma" =>
               CompiledDataPragma(
                 json |> field("range", Position.range),
                 json |> field("name", C.qName),
                 json |> field("data", string),
                 json |> field("constructors", list(string)),
               )
             | "CompiledTypePragma" =>
               CompiledTypePragma(
                 json |> field("range", Position.range),
                 json |> field("name", C.qName),
                 json |> field("type", string),
               )
             | "CompiledPragma" =>
               CompiledPragma(
                 json |> field("range", Position.range),
                 json |> field("name", C.qName),
                 json |> field("haskell", string),
               )
             | "CompiledExportPragma" =>
               CompiledExportPragma(
                 json |> field("range", Position.range),
                 json |> field("name", C.qName),
                 json |> field("export", string),
               )
             | "CompiledJSPragma" =>
               CompiledJSPragma(
                 json |> field("range", Position.range),
                 json |> field("name", C.qName),
                 json |> field("js", string),
               )
             | "CompiledUHCPragma" =>
               CompiledUHCPragma(
                 json |> field("range", Position.range),
                 json |> field("name", C.qName),
                 json |> field("uhc", string),
               )
             | "CompiledDataUHCPragma" =>
               CompiledDataUHCPragma(
                 json |> field("range", Position.range),
                 json |> field("name", C.qName),
                 json |> field("data", string),
                 json |> field("constructors", list(string)),
               )
             | "HaskellCodePragma" =>
               HaskellCodePragma(
                 json |> field("range", Position.range),
                 json |> field("code", string),
               )
             | "ForeignPragma" =>
               ForeignPragma(
                 json |> field("range", Position.range),
                 json |> field("backend", string),
                 json |> field("code", string),
               )
             | "CompilePragma" =>
               CompilePragma(
                 json |> field("range", Position.range),
                 json |> field("backend", string),
                 json |> field("name", C.qName),
                 json |> field("code", string),
               )
             | "StaticPragma" =>
               StaticPragma(
                 json |> field("range", Position.range),
                 json |> field("name", C.qName),
               )
             | "InjectivePragma" =>
               InjectivePragma(
                 json |> field("range", Position.range),
                 json |> field("name", C.qName),
               )
             | "InlinePragma" =>
               InlinePragma(
                 json |> field("range", Position.range),
                 json |> field("inline", bool),
                 json |> field("name", C.qName),
               )
             | "ImportPragma" =>
               ImportPragma(
                 json |> field("range", Position.range),
                 json |> field("module", string),
               )
             | "ImportUHCPragma" =>
               ImportUHCPragma(
                 json |> field("range", Position.range),
                 json |> field("module", string),
               )
             | "ImpossiblePragma" =>
               ImpossiblePragma(json |> field("range", Position.range))
             | "EtaPragma" =>
               EtaPragma(
                 json |> field("range", Position.range),
                 json |> field("name", C.qName),
               )
             | "TerminationCheckPragma" =>
               TerminationCheckPragma(
                 json |> field("range", Position.range),
                 json |> field("name", CommonPrim.terminationCheck(C.name)),
               )
             | "WarningOnUsage" =>
               WarningOnUsage(
                 json |> field("range", Position.range),
                 json |> field("name", C.qName),
                 json |> field("warning", string),
               )
             | "CatchallPragma" =>
               CatchallPragma(json |> field("range", Position.range))
             | "DisplayPragma" =>
               DisplayPragma(
                 json |> field("range", Position.range),
                 json |> field("pattern", pattern()),
                 json |> field("expr", expr()),
               )
             | "NoPositivityCheckPragma" =>
               NoPositivityCheckPragma(
                 json |> field("range", Position.range),
               )
             | "PolarityPragma" =>
               PolarityPragma(
                 json |> field("range", Position.range),
                 json |> field("name", C.name),
                 json
                 |> field(
                      "occurrences",
                      list(TypeCheckingPositivity.occurrence),
                    ),
               )
             | "NoUniverseCheckPragma" =>
               NoUniverseCheckPragma(json |> field("range", Position.range))
             | _ => failwith("unknown kind of Pragma")
             }
           )
      and moduleApplication = () =>
        field("kind", string)
        |> andThen((kind, json) =>
             switch (kind) {
             | "SectionApp" =>
               SectionApp(
                 json |> field("range", Position.range),
                 json |> field("bindings", list(typedBindings)),
                 json |> field("expr", expr()),
               )
             | "RecordModuleIFS" =>
               RecordModuleIFS(
                 json |> field("range", Position.range),
                 json |> field("name", C.qName),
               )
             | _ => failwith("unknown kind of ModuleApplication")
             }
           )
      and fieldAssignmentExpr: decoder(fieldAssignmentExpr) =
        json => {
          name: json |> field("name", C.name),
          value: json |> field("value", expr()),
        }
      /* Ocaml/Reason bug */
      and fieldAssignmentPattern: decoder(fieldAssignmentPattern) =
        json => {
          name: json |> field("name", C.name),
          value: json |> field("value", pattern()),
        }
      and moduleAssignment = json => {
        name: json |> field("name", C.qName),
        exprs: json |> field("exprs", list(expr())),
        importDirective: json |> field("importDirective", importDirective),
      }
      and recordAssignment = () =>
        either(
          json => Type.Left(json |> field("Left", fieldAssignmentExpr)),
          json => Type.Right(json |> field("Right", moduleAssignment)),
        )
      and whereClause_ = decoder =>
        field("kind", string)
        |> andThen((kind, json) =>
             switch (kind) {
             | "SomeWhere" =>
               SomeWhere(
                 json |> field("name", C.name),
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
                   json |> at(["value", "range"], Position.range),
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
                 json |> field("range", Position.range),
                 json
                 |> field(
                      "bindings",
                      list(CommonPrim.withHiding(boundName)),
                    ),
                 json |> field("value", expr()),
               )
             | "TLet" =>
               TLet(
                 json |> field("range", Position.range),
                 json |> field("declarations", list(declaration())),
               )
             | _ => failwith("unknown kind of TypedBinding_")
             }
           )
      and typedBindings = json =>
        TypedBindings(
          json |> field("range", Position.range),
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
      and telescope = () => list(typedBindings)
      and pattern: unit => decoder(pattern) =
        () =>
          field("kind", string)
          |> andThen((kind, json) =>
               switch (kind) {
               | "IdentP" => IdentP(json |> field("name", C.qName))
               | "QuoteP" => QuoteP(json |> field("range", Position.range))
               | "AppP" =>
                 AppP(
                   json |> field("pattern", pattern()),
                   json |> field("arg", CommonPrim.namedArg(pattern())),
                 )
               | "RawAppP" =>
                 RawAppP(
                   json |> field("range", Position.range),
                   json |> field("patterns", list(pattern())),
                 )
               | "OpAppP" =>
                 OpAppP(
                   json |> field("range", Position.range),
                   json |> field("name", C.qName),
                   json |> field("names", array(Abstract.name)),
                   json
                   |> field("args", list(CommonPrim.namedArg(pattern()))),
                 )
               | "HiddenP" =>
                 HiddenP(
                   json |> field("range", Position.range),
                   json |> field("pattern", CommonPrim.named_(pattern())),
                 )
               | "InstanceP" =>
                 InstanceP(
                   json |> field("range", Position.range),
                   json |> field("pattern", CommonPrim.named_(pattern())),
                 )
               | "ParenP" =>
                 ParenP(
                   json |> field("range", Position.range),
                   json |> field("pattern", pattern()),
                 )
               | "WildP" => WildP(json |> field("range", Position.range))
               | "AbsurdP" => AbsurdP(json |> field("range", Position.range))
               | "AsP" =>
                 AsP(
                   json |> field("range", Position.range),
                   json |> field("name", C.name),
                   json |> field("pattern", pattern()),
                 )
               | "DotP" =>
                 DotP(
                   json |> field("range", Position.range),
                   json |> field("expr", expr()),
                 )
               | "LitP" => LitP(json |> field("literal", Literal.literal))
               | "RecP" =>
                 RecP(
                   json |> field("range", Position.range),
                   json |> field("assignments", list(fieldAssignmentPattern)),
                 )
               | "EqualP" =>
                 EqualP(
                   json |> field("range", Position.range),
                   json |> field("pairs", list(pair(expr(), expr()))),
                 )
               | "EllipsisP" =>
                 EllipsisP(json |> field("range", Position.range))
               | "WithP" =>
                 WithP(
                   json |> field("range", Position.range),
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
                 json |> field("range", Position.range),
                 json |> field("pattern", pattern()),
                 json |> field("expr", expr()),
                 json |> field("clauses", list(lamClause)),
               )
             | "DoThen" => DoThen(json |> field("expr", expr()))
             | "DoLet" =>
               DoLet(
                 json |> field("range", Position.range),
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
      open Type.Syntax.Internal;
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
      let elim_ = decoder =>
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
      let rec elim = () => elim_(term())
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
      and type_ = json => {
        sort: json |> field("sort", sort()),
        value: json |> field("value", term()),
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
           );
    };
  };
  module TypeChecking = {
    open Type.TypeChecking;
    let comparison =
      string
      |> andThen((kind, _json) =>
           switch (kind) {
           | "CmpLeq" => CmpLeq
           | _ => CmpEq
           }
         );
    let rep = (decodeFrom, decodeTo, json) => {
      internal: json |> field("internal", decodeFrom),
      concrete: json |> field("concrete", decodeTo),
    };
    let repTerm = rep(Syntax.Internal.term(), Syntax.Concrete.expr());
    let repType = rep(Syntax.Internal.type_, Syntax.Concrete.expr());
    let typeError =
      field("kind", string)
      |> andThen((kind, json) =>
           switch (kind) {
           | "UnequalTerms" =>
             UnequalTerms(
               json |> field("comparison", comparison),
               json |> field("term1", repTerm),
               json |> field("term2", repTerm),
               json |> field("type", repType),
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
