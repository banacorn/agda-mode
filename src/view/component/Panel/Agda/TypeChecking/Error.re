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
  };
  module TypeChecking = {
    open Type.Agda.TypeChecking;
    let error =
      field("kind", string)
      |> andThen((kind, json) =>
           switch (kind) {
           | "TypeError" =>
             TypeError(json |> field("range", Syntax.Position.range))
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

/* Type.Agda.TypeChecking.error */
let parseError = (json: Js.Json.t) => {
  let error = json |> Decode.TypeChecking.error;
  Js.log(json);
  Js.log(error);
  ();
};
