open Rebase;
// open BsChai.Expect;
// open BsMocha;
open! BsMocha.Mocha;
open! BsMocha.Promise;
open Js.Promise;
open Test__Util;

describe("Input Method", () => {
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

  it(
    "should not add class '.agda-mode-input-method-activated' to the editor element before triggering",
    () =>
    File.openAsset("Blank1.agda")
    |> then_(dispatch("agda-mode:load"))
    |> then_(instance => {
         open Instance__Type;
         open Webapi.Dom;

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
    |> then_(instance =>
         instance
         |> Keyboard.press("\\")
         |> then_(_ => {
              open Webapi.Dom;
              instance.editors.source
              |> Atom.Views.getView
              |> HtmlElement.classList
              |> DomTokenList.contains("agda-mode-input-method-activated")
              |> BsMocha.Assert.ok;
              resolve();
            })
       )
  );
});
