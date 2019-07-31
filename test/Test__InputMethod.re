open Rebase;
open BsMocha;
open! BsMocha.Mocha;
open! BsMocha.Promise;
open Js.Promise;
open BsChai.Expect.Expect; // exports `expect`
open BsChai.Expect.Combos;

open Test__Util;

describe("Input Method", () => {
  let activationPromise = ref(None);

  before_each(() => {
    activationPromise :=
      Some(Atom.Environment.Packages.activatePackage("agda-mode"));
    resolve();
  });

  after(() => {
    activationPromise := None;
    Atom.Environment.Packages.deactivatePackage("agda-mode", false);
    closeFile(asset("Blank1.agda"));
  });

  it(
    "should be activated after triggering 'agda-mode:load' on .agda files", () =>
    openFile(asset("Blank1.agda"))
    |> then_(editor => dispatch(editor, "agda-mode:load"))
    |> then_(() => activationPromise^ |> Option.getOr(resolve()))
    |> then_(() =>
         expect("agda-mode")
         |> to_be_one_of(getActivePackageNames())
         |> resolve
       )
  );

});
