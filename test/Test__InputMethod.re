open Rebase;
open Fn;
// open BsChai.Expect;
// open BsMocha;
open! BsMocha.Mocha;
open! BsMocha.Promise;
open Js.Promise;
open Test__Util;

describe_only("Input Method", () => {
  before_each(Package.activate);
  after_each(Package.deactivate);

  // deactivate the input method after each tests
  let deactivateAllInputMethod = () => {
    AgdaMode.instances
    |> Js.Dict.entries
    |> Array.forEach(((_, instance: Instance.t)) =>
         instance.view.activateInputMethod(false)
       )
    |> ignore;
    resolve();
  };

  after_each(deactivateAllInputMethod);
  open Instance__Type;
  open Webapi.Dom;
  it(
    "should not add class '.agda-mode-input-method-activated' to the editor element before triggering",
    () =>
    File.openAsset("Blank1.agda")
    |> then_(dispatch("agda-mode:load"))
    |> then_(instance => {
         instance.editors.source
         |> Atom.Views.getView
         |> HtmlElement.classList
         |> DomTokenList.contains("agda-mode-input-method-activated")
         |> BsMocha.Assert.equal(false);
         resolve();
       })
  );

  it(
    "should add class '.agda-mode-input-method-activated' to the editor element after triggering",
    () =>
    File.openAsset("Blank1.agda")
    |> then_(dispatch("agda-mode:load"))
    |> then_(Keyboard.press("\\"))
    |> then_(instance => {
         instance.editors.source
         |> Atom.Views.getView
         |> HtmlElement.classList
         |> DomTokenList.contains("agda-mode-input-method-activated")
         |> BsMocha.Assert.ok;
         resolve();
       })
  );
  // it("should display the keyboard after triggering", () =>
  //   File.openAsset("Blank1.agda")
  //   |> then_(dispatch("agda-mode:load"))
  //   |> then_(Keyboard.press("\\"))
  //   |> then_(View.getPanelAtBottom)
  //   |> then_(panel => {
  //        Js.log(panel);
  //        //
  //        // instance.editors.source
  //        // |> Atom.Views.getView
  //        // |> HtmlElement.classList
  //        // |> DomTokenList.contains("agda-mode-input-method-activated")
  //        // |> BsMocha.Assert.ok;
  //        resolve();
  //      })
  // );
});
