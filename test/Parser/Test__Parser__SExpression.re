open Rebase;
open BsMocha.Mocha;
open Fn;
open Js.Promise;
open Test__Util;

// [Int] -> String -> [SExpression]
let parseSExpression = (breakpoints, input) => {
  open Parser.Incr.Event;

  let output = ref([||]);

  let parser =
    Parser.SExpression.makeIncr(
      fun
      | OnResult(Rebase.Error(err)) =>
        BsMocha.Assert.fail(
          "Failed when parsing S-expression: " ++ Parser.Error.toString(err),
        )
      | OnResult(Rebase.Ok(a)) => Js.Array.push(a, output^) |> ignore
      | OnFinish => (),
    );

  input
  |> breakInput(breakpoints)
  |> Array.forEach(Connection.parseAgdaOutput(parser));

  output^;
};

describe("when parsing S-expressions wholly", () =>
  getGoldenFilepathsSync("test/Parser/SExpression")
  |> Array.forEach(filepath =>
       BsMocha.Promise.it("should golden test " ++ filepath, () =>
         Golden.readFile(filepath)
         |> then_(
              Golden.map(parseSExpression([||]))
              >> Golden.map(serializeWith(Parser.SExpression.toString))
              >> Golden.compare,
            )
       )
     )
);

describe("when parsing S-expressions incrementally", () =>
  getGoldenFilepathsSync("test/Parser/SExpression")
  |> Array.forEach(filepath =>
       BsMocha.Promise.it("should golden test " ++ filepath, () =>
         Golden.readFile(filepath)
         |> then_(
              Golden.map(parseSExpression([|3, 23, 1234, 2342, 3453|]))
              >> Golden.map(serializeWith(Parser.SExpression.toString))
              >> Golden.compare,
            )
       )
     )
);
