open ReasonReact;

open Type.Syntax.Concrete;

open Type.Syntax.C;

open Type;

open C;

open Util;

let jump = true;

let hover = true;

module Component = {
  let lamBinding = statelessComponent("LamBinding");
  let typedBindings = statelessComponent("TypedBindings");
  let typedBinding = statelessComponent("TypedBinding");
  let declaration = statelessComponent("Declaration");
  let lhs = statelessComponent("LHS");
  let pattern = statelessComponent("Pattern");
  let telescope = statelessComponent("Telescope");
};

module TypedBinding_ = {
  let isUnderscore: underscore(typedBinding) =
    binding =>
      switch (binding) {
      | TBind(_, _, Underscore(_, None)) => true
      | _ => false
      };
};

module Expr_ = {
  open Type.Syntax.CommonPrim;
  open CommonPrim;
  let rec appView: expr => (expr, list(namedArg(expr))) =
    expr => {
      let vApp = ((e, es), arg) => (e, List.append(es, [arg]));
      let arg = expr =>
        switch (expr) {
        | HiddenArg(_, e) => e |> Arg.default |> Arg.setArgInfoHiding(Hidden)
        | InstanceArg(_, e) =>
          e |> Arg.default |> Arg.setArgInfoHiding(Instance(NoOverlap))
        | e => e |> Named.unnamed |> Arg.default
        };
      switch (expr) {
      | App(_, e1, e2) => vApp(appView(e1), e2)
      | RawApp(_, [e, ...es]) => (e, List.map(arg, es))
      | _ => (expr, [])
      };
    };
  let levelToString: int => string = [%raw
    "function (n) { return n.toString().split('').map(x => String.fromCharCode(0x2080 + parseInt(x))).join('')}"
  ];
  let component = statelessComponent("Expr");
};

/* Collection of reactElements for mutual recursive reference */
module Element = {
  /* namespaces */
  /* open Type.Syntax.CommonPrim; */
  open CommonPrim;
  /* elements */
  let rec makeExpr = (~value, _children) => {
    ...Expr_.component,
    render: _self => {
      module Expr = {
        let make = makeExpr;
      };
      module LamBinding = {
        let make = makeLamBinding;
      };
      module TypedBindings = {
        let make = makeTypedBindings;
      };
      module Declaration = {
        let make = makeDeclaration;
      };
      module Telescope = {
        let make = makeTelescope;
      };
      switch (value) {
      | Ident(value) => <QName value />
      | Lit(value) => <Literal value />
      | QuestionMark(range, None) =>
        <Link jump hover range> (string("?")) </Link>
      | QuestionMark(range, Some(n)) =>
        <Link jump hover range> (string("?" ++ string_of_int(n))) </Link>
      | Underscore(range, None) =>
        <Link jump hover range> (string("_")) </Link>
      | Underscore(range, Some(s)) =>
        <Link jump hover range> (string(s)) </Link>
      | App(_, _, _) =>
        let (e1, args) = Expr_.appView(value);
        let items: list(reactElement) = [
          <Expr value=e1 />,
          ...List.map(
               value =>
                 <Arg value>
                   ...(
                        (prec, value) =>
                          <Named prec value>
                            ...((_, value) => <Expr value />)
                          </Named>
                      )
                 </Arg>,
               args,
             ),
        ];
        sepBy(string(" "), items);
      | RawApp(_, exprs) =>
        exprs |> List.map(value => <Expr value />) |> sepBy(string(" "))
      | OpApp(_, func, _, args) =>
        /* the module part of the name */
        /* let ms = QName.moduleParts(func);
           let xs =
             switch (QName.unqualify(func)) {
             | Name(_, xs) => xs
             | NoName(_, _) => failwith("OpApp func has no name")
             };
           let prOp = (ms, xs, es) =>
             switch (xs, es) {
             | ([Hole, ...xs], [e, ...es]) =>
               switch (NamedArg.namedArg(e)) {
               | Placeholder(p) => []
               | _ => []
               }
             | ([Hole, ...xs], []) => failwith("OpApp::prOp")
             | ([Id(x), ...xs], es) => []
             | ([], es) => es |> List.map(value => (<Expr value />, None))
             }; */
        <span> (string("unimplemented: Expr::OpApp")) </span>
      | WithApp(_, expr, exprs) =>
        [expr, ...exprs]
        |> List.map(value => <Expr value />)
        |> sepBy(string(" | "))
      | HiddenArg(_, expr) =>
        CommonPrim.braces(
          <Named value=expr> ...((_, value) => <Expr value />) </Named>,
        )
      | InstanceArg(_, expr) =>
        CommonPrim.dbraces(
          <Named value=expr> ...((_, value) => <Expr value />) </Named>,
        )
      | Lam(_, bindings, AbsurdLam(_, hiding)) =>
        <span>
          (string({js|λ |js}))
          (
            bindings
            |> List.map(value => <LamBinding value />)
            |> sepBy(string(" "))
          )
          <Hiding hiding />
        </span>
      | Lam(_, bindings, expr) =>
        <span>
          (string({js|λ |js}))
          (
            bindings
            |> List.map(value => <LamBinding value />)
            |> sepBy(string(" "))
          )
          <Expr value=expr />
        </span>
      | AbsurdLam(_range, hiding) =>
        <span> (string({js|λ |js})) <Hiding hiding /> </span>
      | ExtendedLam(_range, bindings) =>
        <span>
          (string({js|λ |js}))
          (
            bindings
            |> List.map(value => <LamBinding value />)
            |> sepBy(string(" "))
            |> enclosedBy(string("{"), string("}"))
          )
        </span>
      | Fun(_range, arg, expr) =>
        <span>
          <Arg value=arg> ...((_, value) => <Expr value />) </Arg>
          (string({js| → |js}))
          <Expr value=expr />
        </span>
      | Pi(telescope, expr) =>
        <span>
          <Telescope telescope />
          (string({js| → |js}))
          <Expr value=expr />
        </span>
      | Set(range) => <Link jump hover range> (string("Set")) </Link>
      | Prop(range) => <Link jump hover range> (string("Prop")) </Link>
      | SetN(range, n) =>
        <Link jump hover range>
          (string("Set" ++ Expr_.levelToString(n)))
        </Link>
      | PropN(range, n) =>
        <Link jump hover range>
          (string("Prop" ++ Expr_.levelToString(n)))
        </Link>
      | Let(_, declarations, expr) =>
        <span>
          (string("let "))
          <ul>
            ...(
                 declarations
                 |> List.map(value => <li> <Declaration value /> </li>)
                 |> Array.of_list
               )
          </ul>
          (
            switch (expr) {
            | Some(value) => <span> (string("in ")) <Expr value /> </span>
            | None => null
            }
          )
        </span>
      | Paren(_, value) => CommonPrim.parens(<Expr value />)
      | _ => <span> (string("unimplemented:  Expr::Paren")) </span>
      };
    },
  }
  and makeDeclaration = (~value, _children) => {
    ...Component.declaration,
    render: _self => <span> (string("<Declaration> unimplemented")) </span>,
  }
  and makePattern = (~pattern, _children) => {
    ...Component.pattern,
    render: _self => <span> (string("<Pattern> unimplemented")) </span>,
  }
  and makeTypedBinding = (~value, _children) => {
    ...Component.typedBindings,
    render: _self => {
      module Declaration = {
        let make = makeDeclaration;
      };
      Type.Syntax.CommonPrim.(
        switch (value) {
        | TBind(_, xs, Underscore(_, None)) =>
          xs
          |> List.map((WithHiding(hiding, value)) =>
               <Hiding hiding> <BoundName value /> </Hiding>
             )
          |> sepBy(string(" "))
        | TBind(_, xs, expr) =>
          module Expr = {
            let make = makeExpr;
          };
          let names =
            xs
            |> List.map((WithHiding(hiding, value)) =>
                 <Hiding hiding> <BoundName value /> </Hiding>
               )
            |> sepBy(string(" "));
          <span> names (string(" : ")) <Expr value=expr /> </span>;
        | TLet(_, ds) =>
          <>
            <span> (string("let")) </span>
            <ul>
              ...(
                   ds
                   |> List.map(value => <li> <Declaration value /> </li>)
                   |> Array.of_list
                 )
            </ul>
          </>
        }
      );
    },
  }
  and makeTypedBindings = (~value, _children) => {
    ...Component.typedBindings,
    render: _self => {
      module TypedBinding = {
        let make = makeTypedBinding;
      };
      let TypedBindings(_, Arg(argInfo, binding)) = value;
      if (TypedBinding_.isUnderscore(binding)) {
        <TypedBinding value=binding />;
      } else {
        <span>
          <Relevance relevance=argInfo.modality.relevance />
          <Hiding hiding=argInfo.hiding parens>
            <TypedBinding value=binding />
          </Hiding>
        </span>;
      };
    },
  }
  and makeLamBinding = (~value, _children) => {
    ...Component.lamBinding,
    render: _self => {
      module TypedBindings = {
        let make = makeTypedBindings;
      };
      switch (value) {
      | DomainFree(argInfo, boundName) =>
        if (argInfo.hiding === NotHidden && BoundName.isUnderscore(boundName)) {
          <BoundName value=boundName />;
        } else {
          <span>
            <Relevance relevance=argInfo.modality.relevance />
            <Hiding hiding=argInfo.hiding>
              <BoundName value=boundName />
            </Hiding>
          </span>;
        }
      | DomainFull(value) => <TypedBindings value />
      };
    },
  }
  and makeLHS = (~lhs, _children) => {
    ...Component.lhs,
    render: _self => {
      module Expr = {
        let make = makeExpr;
      };
      module Pattern = {
        let make = makePattern;
      };
      <span>
        <Pattern pattern=lhs.originalPattern />
        (string("rewrite"))
        (
          lhs.rewriteEqn
          |> List.map(value => <Expr value />)
          |> sepBy(string(" | "))
        )
        (string("with"))
        (
          lhs.rewriteEqn
          |> List.map(value => <Expr value />)
          |> sepBy(string(" | "))
        )
      </span>;
    },
  }
  and makeTelescope = (~telescope, _children) => {
    ...Component.telescope,
    render: _self => {
      module TypedBindings = {
        let make = makeTypedBindings;
      };
      let Telescope(typedBindings) = telescope;
      let isMeta = typedBindings =>
        switch (typedBindings) {
        | TypedBindings(_, Arg(_, TBind(_, _, Underscore(_, None)))) =>
          true
        | _ => false
        };
      <span>
        (List.exists(isMeta, typedBindings) ? string({js|∀ |js}) : null)
        (
          typedBindings
          |> List.map(value => <TypedBindings value />)
          |> sepBy(string(" "))
        )
      </span>;
    },
    /* | TypedBindings(Position.range, CommonPrim.arg(typedBinding)) */
  };
};

module Expr = {
  let make = Element.makeExpr;
};

module LHS = {
  let make = Element.makeLHS;
};

module Pattern = {
  let make = Element.makePattern;
};

module Declaration = {
  let make = Element.makeDeclaration;
};
