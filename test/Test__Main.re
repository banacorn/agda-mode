open Rebase;
open BsMocha;
open BsMocha.Mocha;
open Js.Promise;

exception CannotReadPackageJson;

let base = Node.Path.join2([%raw "__dirname"], "../../../");
let file = path => Node.Path.join2(base, path);
let asset = path => Node.Path.join([|base, "test/asset/", path|]);

// bindings for git-branch
[@bs.module] external branch: unit => Js.Promise.t(string) = "git-branch";

// run tests on `master` branch
module Branch = {
  type t =
    | Prod
    | Dev;
  let parse =
    fun
    | "master" => Prod
    | _ => Dev;

  let on = (br, test) => {
    branch()
    |> then_(name =>
         if (parse(name) == br) {
           test() |> resolve;
         } else {
           resolve();
         }
       );
  };

  let onDev = on(Dev);
  let onProd = on(Prod);
};

let readFile = N.Fs.readFile |> N.Util.promisify;
let readPackageJSONMain = () => {
  readFile(. "./package.json")
  |> then_(buffer =>
       buffer
       |> Node.Buffer.toString
       |> Js.Json.parseExn
       |> Js.Json.decodeObject
       |> Option.flatMap(obj => Js.Dict.get(obj, "main"))
       |> Option.flatMap(Js.Json.decodeString)
       |> Option.mapOr(resolve, reject(CannotReadPackageJson))
     );
};

// runs on all the branches other than "master"
Branch.onDev(() =>
  describe("Development version", () =>
    BsMocha.Promise.it("points to AgdaMode.bs", () =>
      readPackageJSONMain()
      |> then_(path => {
           Assert.equal(path, "./lib/js/src/AgdaMode.bs");
           resolve();
         })
    )
  )
);

// runs only on the "master" branch
Branch.onProd(() =>
  describe("Release version", () => {
    BsMocha.Promise.it("has the production bundle ready", () =>
      make((~resolve, ~reject) =>
        N.Fs.access(file("lib/js/bundled.js"), err =>
          switch (Js.Nullable.toOption(err)) {
          | None => resolve(. 0)
          | Some(e) => reject(. N.Exception(e))
          }
        )
      )
    );

    BsMocha.Promise.it("points to the production bundle", () =>
      readPackageJSONMain()
      |> then_(path => {
           Assert.equal(path, "./lib/js/bundled.js");
           resolve();
         })
    );
  })
);

let openFile = path =>
  Atom.Environment.Workspace.openWithOnlyURI(asset(path));

describe("Instances", () => {
  let instances = ref(Js.Dict.empty());
  let size = dict => dict^ |> Js.Dict.keys |> Array.length;

  it("should be activated without any problem", () => {
    instances := AgdaMode.activate();
    Assert.ok(true);
  });

  it("should have no instances before opening any files", () =>
    Assert.equal(size(instances), 0)
  );

  BsMocha.Promise.it("should respect the number of opened .agda file", () =>
    openFile("Blank1.agda")
    |> then_(editor => {
         Assert.equal(size(instances), 1);
         let pane = Atom.Environment.Workspace.getActivePane();
         Atom.Pane.destroyItem_(editor, true, pane);
         Assert.equal(size(instances), 0);
         resolve();
       })
  );

  BsMocha.Promise.it("should respect the number of opened .lagda file", () =>
    openFile("Blank2.lagda")
    |> then_(editor => {
         Assert.equal(size(instances), 1);
         let pane = Atom.Environment.Workspace.getActivePane();
         Atom.Pane.destroyItem_(editor, true, pane);
         Assert.equal(size(instances), 0);
         resolve();
       })
  );
});

//   exception DispatchFailure(string);
// let dispatch = (editor, event) => {
//   let element = Atom.Environment.Views.getView(editor);
//   let result = Atom.Environment.Commands.dispatch(element, "agda-mode:load");
//   switch (result) {
//   | None => reject(DispatchFailure(event))
//   | Some(_) =>
//     Js.log("dispatched!");
//     resolve();
//   };
// };

// let getActivePackageNames = () =>
//   Atom.Environment.Packages.getActivePackages()
//   |> Array.map(o => o |> Atom.Package.name);
//
// let getLoadedPackageNames = () =>
//   Atom.Environment.Packages.getLoadedPackages()
//   |> Array.map((o: Atom.Package.t) => o |> Atom.Package.name);
//
// let dispatch = (editor, event) => {
//   let element = Atom.Environment.Views.getView(editor);
//   let result = Atom.Environment.Commands.dispatch(element, "agda-mode:load");
//   switch (result) {
//   | None => reject(DispatchFailure(event))
//   | Some(_) =>
//     Js.log("dispatched!");
//     resolve();
//   };
// };
//
// describe("activating agda-mode", () =>
//   BsMocha.Promise.it(
//     "should be activated after triggering agda-mode:load on .agda files", () =>
//     Atom.Environment.Packages.activatePackage(
//       "agda-mode",
//       // Atom.Environment.Packages.loadPackages();
//       // Js.log(getLoadedPackageNames() |> Array.length);
//       // // Atom.Environment.Packages.loadPackage("agda-mode");
//       // // Js.log(getLoadedPackageNames() |> Array.length);
//       // openBlankAgdaFile()
//       // |> then_(editor =>
//       //      dispatch(editor, "agda-mode:load")
//       //      |> then_(() => {
//       //           Js.log(getLoadedPackageNames() |> Array.length);
//       //           Js.log(getActivePackageNames()) |> resolve;
//       //         })
//       //      |> then_(() =>
//       //           Atom.Environment.Packages.activatePackage("agda-mode")
//       //         )
//       //      |> then_(() => Assert.ok(true) |> resolve)
//       //    );
//     )
//   )
