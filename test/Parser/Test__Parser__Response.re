open Belt;
open BsMocha.Mocha;
open Js.Promise;
open Test__Util;

open Test__Parser__SExpression;

// [SExpression] -> [Response]
let toResponses = exprs => {
  // keeping the successful parsing result
  // Assert.fail on the failed ones
  exprs
  ->Array.map(Response.parse)
  ->Array.map(
      fun
      | Error(e) => {
          Assert.fail(e);
          [||];
        }
      | Ok(v) => [|v|],
    )
  ->Array.concatMany;
};

describe("when parsing responses", () =>
  Golden.getGoldenFilepathsSync("test/Parser/Response")
  ->Array.forEach(filepath =>
      BsMocha.Promise.it("should golden test " ++ filepath, () =>
        Golden.readFile(filepath)
        |> then_(raw =>
             raw
             ->Golden.map(parseSExpression([||]))
             ->Golden.map(toResponses)
             ->Golden.map(serializeWith(Response.toString))
             ->Golden.compare
           )
      )
    )
);