// open Rebase;
open BsMocha.Mocha;
// open BsMocha;

// open Async;
open Js.Promise;
open Test__Util;

describe("when parsing S-expressions", () => {
  let dirname = "test/Parser/SExpression";
  readGoldenFiles(dirname)
  |> then_(pairs => {
       Js.log(pairs |> Array.length);
       resolve();
     })
  |> ignore;
  // it("should handle test ", () =>
  //   Assert.ok(true)
  // );
  ();
  // getGoldenFilepaths(dirname) |> Async.finalOk(Array.forEach(Js.log));
  // |> Array.forEach(name => it("should handle test ", () =>
  //                            Assert.ok(true)
  //                          ));
});
