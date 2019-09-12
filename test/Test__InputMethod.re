// open Rebase;
// open Fn;

// open BsChai.Expect;
// open BsMocha;
open! BsMocha.Mocha;
open! BsMocha.Promise;
open Js.Promise;
open! Test__Util;

describe("Input Method", () => {
  after_each(Package.cleanup);
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
  it("should not display the keyboard before triggering", () =>
    File.openAsset("Blank1.agda")
    |> then_(dispatch("agda-mode:load"))
    |> then_(View.getPanelAtBottom)
    |> then_(panel => {
         switch (Element.querySelector(".input-method", panel)) {
         | None => BsMocha.Assert.fail("cannot find `.input-method`")
         | Some(element) =>
           element
           |> Element.classList
           |> DomTokenList.contains("hidden")
           |> BsMocha.Assert.ok
         };
         resolve();
       })
  );

  it("should display the keyboard after triggering", () =>
    File.openAsset("Blank1.agda")
    |> then_(dispatch("agda-mode:load"))
    |> then_(Keyboard.press("\\"))
    |> then_(View.getPanelAtBottom)
    |> then_(panel => {
         switch (Element.querySelector(".input-method", panel)) {
         | None => BsMocha.Assert.fail("cannot find `.input-method`")
         | Some(element) =>
           element
           |> Element.classList
           |> DomTokenList.contains("hidden")
           |> BsMocha.Assert.equal(false)
         };
         resolve();
       })
  );
});
