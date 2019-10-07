// open Rebase;
open! BsMocha.Mocha;
open! BsMocha.Promise;
open Js.Promise;
open! Test__Util;

describe_skip("Connection", () =>
  describe("Path", () => {
    after_each(Package.after_each);
    it(
      "should fail when trying to search for the path of program called 'non-agda'",
      () => {
      Atom.Config.set("agda-mode.agdaName", "non-agda") |> ignore;
      openAndLoad("Temp.agda")
      |> then_(_instance => {
           Js.log(Atom.Workspace.getActivePaneItem());
           false |> Assert.no;
           resolve();
         });
    });
  })
);
