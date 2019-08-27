open Rebase;
open Fn;
open! BsMocha.Mocha;
open! BsMocha.Promise;
// open BsChai.Expect.Expect;
// open BsChai.Expect.Combos;

open Test__Util;
open Test__Parser__SExpression;

// bindings for node-dir
[@bs.module "node-dir"]
external promiseFiles: string => Js.Promise.t(array(string)) =
  "promiseFiles";

describe("when loading files", () =>
  describe("when parsing responses from Agda", () => {
    open Async;
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

open Js.Promise;

let toResponses = exprs => {
  let result = Array.map(Response.parse, exprs);
  let extractError =
    fun
    | Error(e) => Some(e)
    | Ok(_) => None;
  let extractOk = Option.fromResult;
  let failures = Array.filterMap(extractError, result);
  failures |> Array.forEach(BsMocha.Assert.fail);
  Array.filterMap(extractOk, result);
};

describe("When doing regression tests", () =>
  getGoldenFilepathsSync("test/TestInputs")
  |> Array.forEach(filepath =>
       BsMocha.Promise.it("should golden test " ++ filepath, () =>
         Golden.readFile(filepath)
         |> then_(
              Golden.map(
                parseSExpression
                >> toResponses
                >> serializeWith(Response.toString),
              )
              >> Golden.compare,
            )
       )
     )
);
