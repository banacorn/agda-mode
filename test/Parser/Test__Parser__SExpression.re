open Rebase;
open BsMocha.Mocha;
// open BsMocha;

// open Async;
open Js.Promise;
open Test__Util;

let parse = input => {
  open Parser.Incr.Event;

  let output = ref("");

  let parser =
    Parser.SExpression.makeIncr(
      fun
      | OnResult(Rebase.Error(_)) => BsMocha.Assert.fail("Parsing failed")
      // | OnResult(Rebase.Ok(A(a))) =>
      //   output := output^ ++ "[[[[[[" ++ a ++ "]]]]]]" ++ "\n"
      | OnResult(Rebase.Ok(a)) =>
        output := output^ ++ Parser.SExpression.toString(a) ++ "\n"
      | OnFinish => (),
    );

  Connection.parseAgdaOutput(parser, input);

  output^;
};

let parseAndCompare = ((_, input, expected)) => {
  let actual = parse(input);

  // compare the expected with the actual

  diffLines(expected, actual)
  |> Array.filter(diff => diff##added || diff##removed)
  |> Array.forEach(diff => {
       if (diff##added) {
         BsMocha.Assert.fail("Unexpected string added: " ++ diff##value);
       };
       if (diff##removed) {
         BsMocha.Assert.fail(
           "Unexpected string missing: ",
           // BsMocha.Assert.fail("Unexpected string missing: " ++ diff##value);
         );
       };
     });
  Js.Promise.resolve();
};

describe("when parsing S-expressions", () =>
  getGoldenFilepathsSync("test/Parser/SExpression")
  |> Array.forEach(filepath =>
       BsMocha.Promise.it("should golden test " ++ filepath, () =>
         readGoldenFile(filepath) |> then_(parseAndCompare)
       )
     )
);
