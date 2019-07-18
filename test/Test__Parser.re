open Rebase;
open! BsMocha.Mocha;
open! BsMocha.Promise;
// open BsChai.Expect.Expect;
// open BsChai.Expect.Combos;

open Async;

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
  | None => Js.Promise.reject(DispatchFailure(event))
  | Some(_) => Js.Promise.resolve()
  };
};
let getActivePackageNames = () =>
  Atom.Environment.Packages.getActivePackages()
  |> Array.map(o => o |> Atom.Package.name);

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
           |> mapError(_ => ())
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

    it("should success", () =>
      promiseFiles("test/asset/agda-stdlib-1.0")
      |> Js.Promise.then_(paths =>
           paths |> Array.slice(~from=0, ~to_=1) |> Js.Promise.resolve
         )
      |> Js.Promise.then_(paths =>
           paths |> Array.map(loadAndParse) |> Js.Promise.all
         )
    );
  })
);
