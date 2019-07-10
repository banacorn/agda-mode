open Rebase;
open BsMocha;
open BsMocha.Mocha;
open Js.Promise;

exception CannotReadPackageJson;

// bindings for git-branch
[@bs.module] external branch: unit => Js.Promise.t(string) = "git-branch";

// run tests on `master` branch
let on = (br, test) => {
  branch()
  |> then_(name =>
       if (name == br) {
         test() |> resolve;
       } else {
         resolve();
       }
     );
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

describe("Development", () =>
  BsMocha.Promise.it("Entry points to AgdaMode.bs", () =>
    readPackageJSONMain()
    |> then_(path => {
         Assert.equal(path, "./lib/js/src/AgdaMode.bs");
         resolve();
       })
  )
);

on("test", () =>
  describe("Development", () =>
    BsMocha.Promise.it("Entry points to AgdaMode.bs", () =>
      readPackageJSONMain()
      |> then_(path => {
           Assert.equal(path, "./lib/js/src/AgdaMode.bs");
           resolve();
         })
    )
  )
);

on("master", () =>
  describe("Release", () => {
    BsMocha.Promise.it("Production bundle exists", () =>
      make((~resolve, ~reject) =>
        N.Fs.access("./lib/js/bundled.js", err =>
          switch (err) {
          | None => resolve(. 0)
          | Some(e) => reject(. N.Exception(e))
          }
        )
      )
    );

    BsMocha.Promise.it("Entry points to the production bundle", () =>
      readPackageJSONMain()
      |> then_(path => {
           Assert.equal(path, "./lib/js/bunbled.js");
           resolve();
         })
    );
  })
);

// exception DispatchFailure(string);
//
// let openBlankAgdaFile = () =>
//   Atom.Environment.Workspace.openWithOnlyURI("../test/asset/Blank.agda");
//
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
// );
//
// .then((editor) => {
//     // get the element of the editor so that we could dispatch commands
//     const element = atom.views.getView(editor)
//     atom.commands.dispatch(element, "agda-mode:load");
//     // wait after it"s activated
//     activationPromise.then(() => {
//         getActivePackageNames().should.contain("agda-mode");
//         editor.should.have.property("core");
//         close(editor)
//         done();
//     });
// });
// // activate language-agda before everything
//
// // load packages before loading them
// Atom.Environment.Packages.loadPackages();
// Js.log(getActivePackageNames());
// Js.log(getLoadedPackageNames() |> Array.length);
//
// describe("#indexOf()", () =>
//   BsMocha.Promise.it("should return -1 when the value is not present", _ =>
//     Atom.Environment.Packages.activatePackage("agda-mode")
//     |> then_(_ => {
//          Js.log("success");
//          resolve(3);
//        })
//   )
// );
// Assert.equal(-1, -1);
