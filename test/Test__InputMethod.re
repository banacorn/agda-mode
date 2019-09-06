open Rebase;
open Fn;
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
    |> then_(editor => {
         open Webapi.Dom;

         Js.log(AgdaMode.instances);

         let element = Atom.Views.getView(editor);

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
    |> then_(editor => {
         let element = Atom.Views.getView(editor);
         Js.log(AgdaMode.instances);
         let result =
           getInstance(editor)
           |> then_((instance: Instance.t) =>
                instance.view.onInputMethodActivationChange()
                |> then_(
                     fun
                     | Ok(true) => resolve()
                     | _ =>
                       reject(
                         Exn("input method not activated for some reason"),
                       ),
                   )
              )
           |> then_(() => {
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
