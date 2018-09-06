open ReasonReact;

open Type;

open Syntax.CommonPrim;

module type Pretty = {type t; let make: (t, int) => reactElement;};

/* module type PrettyType = {type t; let make: t => reactElement;};

   module PrettyClass = (Instance: PrettyType) => {
     let component = statelessComponent("Test");
     let make = (~value, children) => {
       ...component,
       render: _self => Instance.make(value),
     };
   }; */
let id = children => array(children);

/* let braces = children => <span>  ...children  </span>; */
let braces = children =>
  <span>
    ...(Array.concat([[|string("{")|], children, [|string("}")|]]))
  </span>;

let dbraces = children =>
  <span>
    ...(Array.concat([[|string("{{")|], children, [|string("}}")|]]))
  </span>;

let parens = children =>
  <span>
    ...(Array.concat([[|string("(")|], children, [|string(")")|]]))
  </span>;

let parensIf = (p, children) => p ? parens(children) : array(children);

module Hiding = {
  let component = statelessComponent("Hiding");
  let make =
      (~value=NotHidden, ~prec=0, ~parens, children: array(reactElement)) => {
    ...component,
    render: _self =>
      switch (value) {
      | Hidden => <> (braces(children)) </>
      | Instance(_) => <> (dbraces(children)) </>
      | NotHidden => <> (parens(children)) </>
      },
  };
};

module Named = {
  let map = (f, named) => {...named, value: f(named.value)};
  let unnamed = value => Named(None, value);
  let named = (name, value) => Named(Some(name), value);
  let make = (Named(name, value), prec, children) =>
    switch (name) {
    | None => children(value, prec)
    | Some(Ranged(_, s)) =>
      parensIf(prec > 0, [|string(s ++ "="), children(value, 0)|])
    };
  /* let component = statelessComponent("Named");
     let make = (~value, ~prec=0, children) => {
       ...component,
       render: _self =>
         switch (value.name) {
         | None => children(value.value, ~prec)
         | Some(s) =>
           parensIf(
             prec > 0,
             [|string(s.value ++ "="), children(value.value, ~prec=0)|],
           )
         },
     }; */
};

module ArgInfo = {
  let default: argInfo = {
    hiding: NotHidden,
    modality: {
      relevance: Relevant,
      quantity: QuantityOmega,
    },
    origin: UserWritten,
    freeVariables: UnknownFVs,
  };
  let isVisible: argInfo => bool = argInfo => argInfo.hiding === NotHidden;
  let isHidden: argInfo => bool = argInfo => argInfo.hiding === Hidden;
};

module Arg = {
  let default: 'a => arg('a) = value => Arg(ArgInfo.default, value);
  let map = (f, arged) => {...arged, value: f(arged.value)};
  let setArgInfoHiding = (hiding: hiding, Arg(argInfo, value): arg('a)) =>
    Arg({...argInfo, hiding}, value);
  let make = (Arg(argInfo, value), prec, children) => {
    let p = ArgInfo.isVisible(argInfo) ? prec : 0;
    let localParens = argInfo.origin == Substitution ? parens : id;
    <Hiding value=argInfo.hiding parens=localParens>
      (children(value, p))
    </Hiding>;
  };
};
/*
 module type PrettyType = {type t; let print: t => string;};

 module Make = (Fst: PrettyType, Snd: PrettyType) => {
   type t = (Fst.t, Snd.t);
   let make = (f: Fst.t, s: Snd.t) => (f, s);
   let print = ((f, s): t) =>
     "(" ++ Fst.print(f) ++ ", " ++ Snd.print(s) ++ ")";
 };

 module PrettyString = {
   type t = string;
   let print = (s: t) => s;
 };

 module PrettyInt = {
   type t = int;
   let print = (i: t) => string_of_int(i);
 };

 module PrettySI = Make(PrettyString, PrettyInt);

 let () = {
   open PrettySI;
   let pair = make("Jane", 53);
   let str = print(pair);
   print_string(str);
 }; */
