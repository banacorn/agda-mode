open Rebase;
// open Fn;
// open BsChai.Expect;
// open BsMocha;
open! BsMocha.Mocha;
open! BsMocha.Promise;
open Js.Promise;
open Test__Util;

describe_only("Input Method", () => {
  before(Package.activate);
  after(Package.deactivate);

  it(
    "should not add class '.agda-mode-input-method-activated' to the editor element before triggering",
    () =>
    File.openAsset("Blank1.agda")
    |> then_(dispatch("agda-mode:load"))
    |> then_(editor => {
         open Webapi.Dom;

         let element = Atom.Views.getView(editor);

         element
         |> HtmlElement.classList
         |> DomTokenList.contains("agda-mode-input-method-activated")
         |> BsMocha.Assert.equal(false);

         resolve();
       })
  );

  BsMocha.Async.it(
    "should add class '.agda-mode-input-method-activated' to the editor element after triggering",
    done_ =>
    File.openAsset("Blank1.agda")
    |> then_(dispatch("agda-mode:load"))
    |> then_(editor => {
         let element = Atom.Views.getView(editor);

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
              done_();
              resolve();
            })
         |> ignore;

         // building and triggering the event
         let press = key =>
           Atom.Keymaps.buildKeydownEvent_(
             key,
             {
               "ctrl": false,
               "alt": false,
               "shift": false,
               "cmd": false,
               "which": 0,
               "target": element,
             },
           );
         Atom.Keymaps.handleKeyboardEvent(press("\\"));

         resolve();
       })
    |> ignore
  );
});
