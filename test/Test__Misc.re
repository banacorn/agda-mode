open! BsMocha.Mocha;
open! BsMocha.Promise;

open Test__Util;

// bindings for node-dir
[@bs.module "node-dir"]
external promiseFiles: string => Js.Promise.t(array(string)) =
  "promiseFiles";

describe_skip("when loading files", () =>
  describe("when parsing responses from Agda", () => {
    let loadAndParse = path => {
      File.open_(path)
      |> Js.Promise.then_(editor => {
           let instance = Instance.make(editor);
           Connection.autoSearch("agda")
           ->Promise.mapOk(x => x ++ " --no-libraries")
           ->Promise.flatMapOk(Connection.validateAndMake)
           ->Promise.mapOk(Connection.connect)
           ->Promise.mapOk(Connection.wire)
           ->Promise.mapOk(Instance.Connections.persistConnection(instance))
           ->Promise.mapError(error => BsMocha.Assert.fail(error))
           ->Promise.flatMapOk(_ =>
               Instance.Handler.handleCommand(Command.Load, instance)
               ->Promise.flatMapOk(
                   Instance.Handler.handleRequest(instance, (_, _) =>
                     Promise.resolved(Rebase.Ok())
                   ),
                 )
               ->Promise.mapOk(_ => Assert.ok())
               ->Promise.mapError(error => {
                   BsMocha.Assert.fail(error);
                   ();
                 })
             )
           ->Promise.Js.toBsPromise;
         });
    };

    it("should succeed", () =>
      loadAndParse(Path.asset("Algebra.agda"))
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
