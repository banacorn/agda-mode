open Belt;

type removeTokenBasedHighlighting =
  | Remove
  | Keep;

type filepath = string;
module Token = Parser.SExpression;

module Annotation = {
  open Token;
  type t = {
    start: int,
    end_: int,
    types: array(string),
    source: option((filepath, int)),
  };
  let toString = self =>
    "Annotation "
    ++ string_of_int(self.start)
    ++ " "
    ++ string_of_int(self.end_)
    ++ " "
    ++ Util.Pretty.list(List.fromArray(self.types))
    ++ (
      switch (self.source) {
      | None => ""
      | Some((s, i)) => s ++ " " ++ string_of_int(i)
      }
    );
  let parse: Token.t => option(t) =
    fun
    | A(_) => None
    | L(xs) =>
      switch (xs) {
      | [|
          A(start'),
          A(end_'),
          types,
          _,
          _,
          L([|A(filepath), _, A(index')|]),
        |] =>
        Parser.int(start')
        ->Option.flatMap(start =>
            Parser.int(end_')
            ->Option.flatMap(end_ =>
                Parser.int(index')
                ->Option.map(index =>
                    {
                      start,
                      end_,
                      types: flatten(types),
                      source: Some((filepath, index)),
                    }
                  )
              )
          )

      | [|A(start'), A(end_'), types|] =>
        Parser.int(start')
        ->Option.flatMap(start =>
            Parser.int(end_')
            ->Option.map(end_ =>
                {start, end_, types: flatten(types), source: None}
              )
          )
      | [|A(start'), A(end_'), types, _|] =>
        Parser.int(start')
        ->Option.flatMap(start =>
            Parser.int(end_')
            ->Option.map(end_ =>
                {start, end_, types: flatten(types), source: None}
              )
          )
      | _ => None
      };
  let parseDirectHighlightings: array(Token.t) => array(t) =
    tokens => {
      tokens
      ->Js.Array.sliceFrom(2, _)
      ->Array.map(parse)
      ->Array.keepMap(x => x);
    };
  let parseIndirectHighlightings: array(Token.t) => array(t) =
    tokens =>
      tokens
      ->Js.Array.sliceFrom(1, _)
      ->Array.map(parse)
      ->Array.keepMap(x => x);
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