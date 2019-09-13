open Rebase;
// open Fn;

// open BsChai.Expect;
// open BsMocha;
open! BsMocha.Mocha;
open! BsMocha.Promise;
open Js.Promise;
open! Test__Util;

describe("Input Method", () => {
  open Instance__Type;

  describe("View", () => {
    after_each(Package.cleanup);
    open Webapi.Dom;
    it(
      "should not add class '.agda-mode-input-method-activated' to the editor element before triggering",
      () =>
      openAndLoad("Temp.agda")
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
      openAndLoad("Temp.agda")
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
      openAndLoad("Temp.agda")
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

  describe("View", () => {
    after_each(Package.cleanup);

    it("should notify when triggered", () =>
      openAndLoad("Temp.agda")
      |> then_(instance => {
           let onDispatch =
             instance.view.onInputMethodActivationChange
             |> Event.once
             |> Async.toPromise;

           // dispatch!
           instance
           |> Keyboard.dispatch("\\")
           |> then_(_ =>
                onDispatch
                |> then_(activated => {
                     BsMocha.Assert.equal(true, activated);
                     resolve(instance);
                   })
              );
         })
      |> then_(instance => {
           let onDispatch =
             instance.view.onInputMethodActivationChange
             |> Event.once
             |> Async.toPromise;

           // dispatch!
           instance
           |> Keyboard.dispatch("\\")
           |> then_(_ =>
                onDispatch
                |> then_(activated => {
                     BsMocha.Assert.equal(false, activated);
                     resolve(instance);
                   })
              );
         })
    );

    it("should notify when triggered", () =>
      openAndLoad("Temp.agda")
      |> then_(Keyboard.dispatch("\\"))
      |> then_(instance => {
           // listen
           let onDispatch =
             instance.view.onInputMethodActivationChange
             |> Event.once
             |> Async.toPromise;

           // type!
           Keyboard.insert("G", instance);
           Keyboard.insert("l", instance);

           instance
           |> Keyboard.dispatch("escape")
           |> then_(_ => onDispatch)
           |> then_(activated => {
                BsMocha.Assert.equal(activated, false);
                instance.editors.source
                |> Atom.TextEditor.getText
                |> BsMocha.Assert.equal({js|λ|js});
                resolve();
              });
         })
    );
  });
});
