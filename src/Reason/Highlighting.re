open Rebase;

type removeTokenBasedHighlighting =
  | Remove
  | Keep;

type filepath = string;
module Token = Emacs.Parser.SExpression;

module Annotation = {
  open Token;
  type t = {
    start: int,
    end_: int,
    types: array(string),
    source: option((filepath, int)),
  };
  let parse: Token.t => result(t, string) =
    fun
    | A(s) => Error(toString(A(s)))
    | L(xs) =>
      switch (xs) {
      | [|
          A(start),
          A(end_),
          types,
          _,
          _,
          L([|A(filepath), _, A(index)|]),
        |] =>
        Ok({
          start: int_of_string(start),
          end_: int_of_string(end_),
          types: flatten(types),
          source: Some((filepath, int_of_string(index))),
        })
      | [|A(start), A(end_), types|] =>
        Ok({
          start: int_of_string(start),
          end_: int_of_string(end_),
          types: flatten(types),
          source: None,
        })
      | [|A(start), A(end_), types, _|] =>
        Ok({
          start: int_of_string(start),
          end_: int_of_string(end_),
          types: flatten(types),
          source: None,
        })
      | _ => Error(toString(L(xs)))
      };
  let parseDirectHighlighting: array(Token.t) => array(t) =
    tokens => {
      tokens
      |> Js.Array.sliceFrom(2)
      |> Array.map(parse)
      |> Array.filterMap(Option.fromResult);
    };
  let parseIndirectHighlighting: array(Token.t) => array(t) =
    tokens =>
      tokens
      |> Js.Array.sliceFrom(1)
      |> Array.map(parse)
      |> Array.filterMap(Option.fromResult);
  /* the type of annotations that we want to highlight */
  let shouldHighlight: t => bool =
    annotation => {
      annotation.types
      |> Js.Array.includes("unsolvedmeta")
      || annotation.types
      |> Js.Array.includes("unsolvedconstraint")
      || annotation.types
      |> Js.Array.includes("terminationproblem")
      || annotation.types
      |> Js.Array.includes("coverageproblem");
    };
};

type t = Atom.DisplayMarker.t;
