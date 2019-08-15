open Rebase;
open BsMocha;
open! BsMocha.Mocha;
open! BsMocha.Promise;
open Js.Promise;
open BsChai.Expect.Expect; // exports `expect`
open BsChai.Expect.Combos;

exception CannotReadPackageJson;

open Test__Util;

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
    it("points to AgdaMode.bs", () =>
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
    it("has the production bundle ready", () =>
      make((~resolve, ~reject) =>
        N.Fs.access(file("lib/js/bundled.js"), err =>
          switch (Js.Nullable.toOption(err)) {
          | None => resolve(. 0)
          | Some(e) => reject(. N.Exception(e))
          }
        )
      )
    );

    it("points to the production bundle", () =>
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
    resolve();
  });

  it("should have no instances before opening any files", () =>
    Assert.equal(size(instances), 0) |> resolve
  );

  it("should respect the number of opened .agda file", () =>
    openFile(asset("Blank1.agda"))
    |> then_(editor => {
         Assert.equal(size(instances), 1);
         let pane = Atom.Environment.Workspace.getActivePane();
         Atom.Pane.destroyItem_(editor, true, pane);
       })
    |> then_(destroyed => {
         Assert.equal(size(instances), destroyed ? 0 : 1);
         resolve();
       })
  );

  it("should respect the number of opened .lagda file", () =>
    openFile(asset("Blank2.lagda"))
    |> then_(editor => {
         Assert.equal(size(instances), 1);
         let pane = Atom.Environment.Workspace.getActivePane();
         Atom.Pane.destroyItem_(editor, true, pane);
       })
    |> then_(destroyed => {
         Assert.equal(size(instances), destroyed ? 0 : 1);
         resolve();
       })
  );

  it("should include '.agda' in the classlist", () =>
    openFile(asset("Blank1.agda"))
    |> then_(editor => {
         editor
         |> Atom.Views.getView
         |> Webapi.Dom.HtmlElement.classList
         |> Webapi.Dom.DomTokenList.contains("agda")
         |> Assert.ok;
         resolve();
       })
  );
});

describe("agda-mode", () => {
  let activationPromise = ref(None);

  before_each(() => {
    activationPromise := Some(Atom.Packages.activatePackage("agda-mode"));
    resolve();
  });

  after_each(() => {
    activationPromise := None;
    Atom.Packages.deactivatePackage("agda-mode", false);
  });

  it(
    "should be activated after triggering 'agda-mode:load' on .agda files", () => {
    // before
    expect("agda-mode")
    |> not
    |> to_be_one_of(getActivePackageNames())
    |> ignore;

    openFile("Blank1.agda")
    |> then_(editor => dispatch(editor, "agda-mode:load"))
    |> then_(() => activationPromise^ |> Option.getOr(resolve()))
    |> then_(()
         // after
         =>
           expect("agda-mode")
           |> to_be_one_of(getActivePackageNames())
           |> resolve
         );
  });

  it(
    "should be activated after triggering 'agda-mode:load' on .lagda files", () => {
    // before
    expect("agda-mode")
    |> not
    |> to_be_one_of(getActivePackageNames())
    |> ignore;

    openFile("Blank2.lagda")
    |> then_(editor => dispatch(editor, "agda-mode:load"))
    |> then_(() => activationPromise^ |> Option.getOr(resolve()))
    |> then_(()
         // after
         =>
           expect("agda-mode")
           |> to_be_one_of(getActivePackageNames())
           |> resolve
         );
  });
});
