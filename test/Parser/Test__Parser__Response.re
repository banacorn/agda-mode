open Rebase;
open BsMocha.Mocha;
open Fn;
open Js.Promise;
open Test__Util;

open Test__Parser__SExpression;

// [SExpression] -> [Response]
let toResponses = exprs => {
  let result = Array.map(Response.parse, exprs);
  let extractError =
    fun
    | Error(e) => Some(e)
    | Ok(_) => None;
  let extractOk = Option.fromResult;
  let failures = Array.filterMap(extractError, result);
  failures |> Array.forEach(Assert.fail);
  Array.filterMap(extractOk, result);
};

describe("when parsing responses", () =>
  Golden.getGoldenFilepathsSync("test/Parser/Response")
  |> Array.forEach(filepath =>
       BsMocha.Promise.it("should golden test " ++ filepath, () =>
         Golden.readFile(filepath)
         |> then_(
              Golden.map(
                parseSExpression([||])
                >> toResponses
                >> serializeWith(Response.toString),
              )
              >> Golden.compare,
            )
       )
     )
);
