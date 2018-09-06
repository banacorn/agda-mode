open ReasonReact;

open Type;

open Syntax.Concrete;

open Syntax.C;

module NamePart = {
  let pretty: pretty(namePart) =
    part =>
      switch (part) {
      | Hole => "_"
      | Id(s) => s
      };
};

module Name = {
  let isUnderscore: underscore(name) =
    name =>
      switch (name) {
      | NoName(_, _) => true
      | Name(_, [Id(x)]) => x === "_"
      | _ => false
      };
  let pretty: pretty(name) =
    name =>
      switch (name) {
      | Name(_, xs) => String.concat("", List.map(NamePart.pretty, xs))
      | NoName(_, _) => "_"
      };
  let component = statelessComponent("Name");
  let make = (~value, children) => {
    ...component,
    render: _self => <span> (string(pretty(value))) </span>,
  };
};

let sepBy = (sep: reactElement, item: list(reactElement)) =>
  switch (item) {
  | [] => <> </>
  | [x] => x
  | [x, ...xs] =>
    <> x (array(Array.of_list(List.map(i => <> sep i </>, xs)))) </>
  };

module QName = {
  let component = statelessComponent("QName");
  let make = (~value, children) => {
    ...component,
    render: _self =>
      sepBy(string("."), List.map(n => <Name value=n />, value)),
  };
};

module Expr = {
  open CommonPrim;
  let rec appView: expr => (expr, list(Syntax.CommonPrim.namedArg(expr))) =
    expr => {
      let vApp = ((e, es), arg) => (e, List.append(es, [arg]));
      let arg = expr =>
        switch (expr) {
        | HiddenArg(_, e) =>
          e
          |> CommonPrim.Arg.default
          |> CommonPrim.Arg.setArgInfoHiding(Syntax.CommonPrim.Hidden)
        | InstanceArg(_, e) =>
          e
          |> CommonPrim.Arg.default
          |> CommonPrim.Arg.setArgInfoHiding(
               Syntax.CommonPrim.Instance(Syntax.CommonPrim.NoOverlap),
             )
        | e => e |> CommonPrim.Named.unnamed |> CommonPrim.Arg.default
        };
      switch (expr) {
      | App(r, e1, e2) => vApp(appView(e1), e2)
      | RawApp(_, [e, ...es]) => (expr, List.map(arg, es))
      | _ => (expr, [])
      };
    };
  let component = statelessComponent("Expr");
  let rec make = (~value, ~prec=0, children) => {
    ...component,
    render: _self =>
      switch (value) {
      | Ident(x) => <QName value=x />
      | App(_, _, _) =>
        let (e1, args) = appView(value);
        let items: list(reactElement) = [
          element(make(~value=e1, [||])),
          ...List.map(
               arg =>
                 Arg.render(
                   Named.render((Prec(prec, expr)) =>
                     element(make(~value=expr, ~prec, [||]))
                   ),
                   Prec(0, arg),
                 ),
               args,
             ),
        ];
        sepBy(string(" "), items);
      | _ => <span> (string("unimplemented")) </span>
      },
  };
};
