// open Rebase;
open! BsMocha.Mocha;
open! BsMocha.Promise;
// open BsChai.Expect.Expect;
// open BsChai.Expect.Combos;

open Async;
open Test__Util;

// bindings for node-dir
[@bs.module "node-dir"]
external promiseFiles: string => Js.Promise.t(array(string)) =
  "promiseFiles";

let singleRegressionTest = (fileName, ()) => {
  let read = Node.Fs.readFileAsUtf8Sync;
  let input = read("test/TestInputs/" ++ fileName ++ ".in");
  let expectedOutput: string = read("test/TestInputs/" ++ fileName ++ ".out");
  open Parser.Incr.Event;

  let toResponse =
    flatMapOnResult(expr =>
      switch (Response.parse(expr)) {
      | Error(err) => OnError(err)
      | Ok(response) => OnResult(response)
      }
    );

  let parsedOutput = ref("");
  let onResponse =
    fun
    | OnError(_) => BsMocha.Assert.fail("Parsing failed")
    | OnResult(a) =>
      parsedOutput := parsedOutput^ ++ Response.toString(a) ++ "\n"
    | OnFinish => ();

  let parser = Parser.SExpression.makeIncr(x => x |> toResponse |> onResponse);

  Connection.parseAgdaOutput(parser, input);

  if (parsedOutput^ == expectedOutput) {
    BsMocha.Assert.ok(true);
  } else {
    let splitExpected = Js.String.split("\n", expectedOutput);
    let splitOutput = Js.String.split("\n", parsedOutput^);
    let errorString = ref("");
    if (ArrayLabels.length(splitExpected) != ArrayLabels.length(splitOutput)) {
      BsMocha.Assert.fail("Output has an unexpected number of lines.");
    };
    for (i in 0 to ArrayLabels.length(splitExpected) - 1) {
      let a = splitExpected[i];
      let b = splitOutput[i];
      if (a != b) {
        let errorMsg =
          "Line "
          ++ string_of_int(i)
          ++ " differs.\n"
          ++ "  Expecting:\n"
          ++ a
          ++ "\n  Got:\n"
          ++ b
          ++ "\n";
        errorString := errorString^ ++ errorMsg;
      };
    };
    BsMocha.Assert.fail("Unexpected output of parser\n" ++ errorString^);
  };
  resolve();
};

describe("when loading files", () =>
  describe("when parsing responses from Agda", () => {
    let loadAndParse = path => {
      openFile(path)
      |> Js.Promise.then_(editor => {
           let instance = Instance.make(editor);
           Connection.autoSearch("agda")
           |> mapOk(x => x ++ " --no-libraries")
           |> thenOk(Connection.validateAndMake)
           |> thenOk(Connection.connect)
           |> mapOk(Connection.wire)
           |> mapOk(Instance.Connections.set(instance))
           |> mapError(_ =>
                BsMocha.Assert.fail(Atom.TextEditor.getPath(editor))
              )
           |> thenOk(_ =>
                instance
                |> Instance.Handler.handleLocalCommand(
                     Command.Primitive.Load,
                   )
                |> thenOk(
                     Instance.Handler.handleRemoteCommand(instance, (_, _) =>
                       resolve()
                     ),
                   )
                |> thenOk(_ => {
                     BsMocha.Assert.ok(true);
                     resolve();
                   })
                |> mapError(_ => {
                     BsMocha.Assert.fail(Atom.TextEditor.getPath(editor));
                     ();
                   })
              );
         });
    };

    it("should succeed", () =>
      loadAndParse(asset("Algebra.agda"))
    );
    // promiseFiles("test/asset/agda-stdlib-1.0")
    // |> Js.Promise.then_(paths =>
    //      paths |> Array.slice(~from=0, ~to_=1) |> Js.Promise.resolve
    //    )
    // |> Js.Promise.then_(paths =>
    //      paths |> Array.map(loadAndParse) |> Js.Promise.all
    //    )
  })
);

describe("When doing regression tests", () => {
  let contentArray = Node.Fs.readdirSync("test/TestInputs");
  let isInFile = name => Js.String.endsWith(".in", name);
  let ditchExt: string => string =
    name =>
      Js.String.substring(~from=0, ~to_=Js.String.length(name) - 3, name);
  let testNames =
    Js.Array.filter(isInFile, contentArray) |> Array.map(ditchExt);
  for (i in 0 to ArrayLabels.length(testNames) - 1) {
    it(
      "should handle test " ++ testNames[i],
      singleRegressionTest(testNames[i]),
    );
  };
});
