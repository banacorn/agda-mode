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
    activationPromise := Some(Atom.Packages.activatePackage("agda-mode"));
    resolve();
  });

  after(() => {
    activationPromise := None;
    Atom.Packages.deactivatePackage("agda-mode", false);
    closeFile(asset("Blank1.agda"));
  });

  // var key;
  // key = atom.keymaps.constructor.buildKeydownEvent('tab', {target: document.activeElement});
  // return atom.keymaps.handleKeyboardEvent(key);

  it(
    "should be activated after triggering 'agda-mode:load' on .agda files", () =>
    openFile(asset("Blank1.agda"))
    |> then_(editor => {
         Js.log(editor);
         Js.log(editor);
         resolve();
       })
  );
});
