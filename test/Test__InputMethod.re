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

         let element = Atom.Views.getView(instance.editors.source);

         element
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
    |> then_(instance => {
         open Instance__Type;
         let element = Atom.Views.getView(instance.editors.source);
         let result =
           instance.view.onInputMethodActivationChange()
           |> then_(
                fun
                | Ok(result) => resolve(result)
                | Error(_) =>
                  reject(Exn("input method not activated for some reason")),
              )
           |> then_(result => {
                BsMocha.Assert.ok(result);

                element
                |> Webapi.Dom.HtmlElement.classList
                |> Webapi.Dom.DomTokenList.contains(
                     "agda-mode-input-method-activated",
                   )
                |> BsMocha.Assert.ok;

                resolve();
              });

         Keyboard.press(element, "\\");
         result;
       })
  );
});
