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
    openAndLoad("Blank1.agda")
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
    openAndLoad("Blank1.agda")
    |> then_(Keyboard.dispatch("\\"))
    |> then_(instance => {
         instance.editors.source
         |> Atom.Views.getView
         |> HtmlElement.classList
         |> DomTokenList.contains("agda-mode-input-method-activated")
         |> BsMocha.Assert.ok;
         resolve();
       })
  );

  it("should display the keyboard after triggering", () =>
    openAndLoad("Blank1.agda")
    |> then_(instance =>
         instance
         |> View.getPanel
         |> then_(View.querySelector(".input-method"))
         |> then_(element => {
              element
              |> HtmlElement.classList
              |> DomTokenList.contains("hidden")
              |> BsMocha.Assert.equal(true);
              resolve(instance);
            })
       )
    |> then_(Keyboard.dispatch("\\"))  // trigger
    |> then_(instance =>
         instance
         |> View.getPanel
         |> then_(View.querySelector(".input-method"))
         |> then_(element => {
              element
              |> HtmlElement.classList
              |> DomTokenList.contains("hidden")
              |> BsMocha.Assert.equal(false);
              resolve();
            })
       )
  );
});
