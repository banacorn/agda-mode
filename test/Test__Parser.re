open Rebase;
open! BsMocha.Mocha;
open! BsMocha.Promise;
open Js.Promise;
open BsChai.Expect.Expect;
open BsChai.Expect.Combos;

// bindings for node-dir
[@bs.module "node-dir"]
external promiseFiles: string => Js.Promise.t(array(string)) =
  "promiseFiles";

let base = Node.Path.join2([%raw "__dirname"], "../../../");
let file = path => Node.Path.join2(base, path);
let openFile = path =>
  Atom.Environment.Workspace.openWithOnlyURI(file(path));

exception DispatchFailure(string);
let dispatch = (editor: Atom.TextEditor.t, event) => {
  let element = Atom.Environment.Views.getView(editor);
  let result = Atom.Environment.Commands.dispatch(element, event);
  switch (result) {
  | None => reject(DispatchFailure(event))
  | Some(_) => resolve()
  };
};
let getActivePackageNames = () =>
  Atom.Environment.Packages.getActivePackages()
  |> Array.map(o => o |> Atom.Package.name);

describe("when loading files", () =>
  describe("when parsing responses from Agda", () => {
    // Instance.make(textEditor)

    let loadAndParse = path => {
      openFile(path)
      |> then_(editor => {
           let instance = Instance.make(editor);

           Connection.autoSearch("agda")
           |> Async.thenOk(Connection.validateAndMake)
           |> Async.thenOk(Connection.connect)
           |> then_(conn => Js.log(conn) |> resolve);
           // instance
           // |> Connection.autoSearch("agda")
           // // |> Connection.validateAndMake.get
           // |> then_(conn => Js.log(conn) |> resolve)
           // // |> Instance.Handler.handleLocalCommand(Command.Primitive.Load)
           // // |> Async.thenOk(e => {
           // //      Js.log(e);
           // //      Async.resolve(e);
           // //    })
           // // |> Async.thenOk(
           // //      Instance.Handler.handleRemoteCommand(
           // //        instance,
           // //        (_, response) => {
           // //          Js.log(response);
           // //          Async.resolve();
           // //        },
           // //      ),
           // //    )
           // // |> Async.toPromise
           // |> then_(_ => Instance.destroy(instance) |> resolve);
         });
    };

    it("should success", () =>
      promiseFiles("test/asset/agda-stdlib-1.0")
      |> then_(paths => paths |> Array.slice(~from=0, ~to_=1) |> resolve)
      |> then_(paths => paths |> Array.map(loadAndParse) |> Js.Promise.all)
    );
  })
);
