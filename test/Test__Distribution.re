open Rebase;
open Fn;

open BsMocha;
open! BsMocha.Mocha;
open! BsMocha.Promise;
open Js.Promise;
open Test__Util;

exception CannotReadPackageJson;

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
  |> then_(
       Node.Buffer.toString
       >> Js.Json.parseExn
       >> Js.Json.decodeObject
       >> Option.flatMap(obj => Js.Dict.get(obj, "main"))
       >> Option.flatMap(Js.Json.decodeString)
       >> Option.mapOr(resolve, reject(CannotReadPackageJson)),
     );
};

describe("Distribution", () => {
  // runs on all the branches other than "master"
  Branch.onDev(() =>
    describe("when on the development branch", () =>
      it("should points to AgdaMode.bs", () =>
        readPackageJSONMain()
        |> then_(path => {
             Assert.equal(path, "./lib/js/src/AgdaMode.bs");
             resolve();
           })
      )
    )
  )
  |> ignore;

  // runs only on the "master" branch
  Branch.onProd(() =>
    describe("when on the master branch", () => {
      it("has the production bundle ready", () =>
        make((~resolve, ~reject) =>
          N.Fs.access(Path.file("lib/js/bundled.js"), err =>
            switch (err) {
            | None => resolve(. 0)
            | Some(e) => reject(. N.Exception(e))
            }
          )
        )
      );

      it("should points to the production bundle", () =>
        readPackageJSONMain()
        |> then_(path => {
             Assert.equal(path, "./lib/js/bundled.js");
             resolve();
           })
      );
    })
  )
  |> ignore;
});
