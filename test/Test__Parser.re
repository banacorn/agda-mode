open Rebase;
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
  contentArray
  |> Array.filter(isInFile)
  |> Array.map(ditchExt)
  |> Array.forEach(name =>
       it("should handle test " ++ name, singleRegressionTest(name))
     );
});
