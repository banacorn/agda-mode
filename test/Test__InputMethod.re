// open BsChai.Expect;
// open BsMocha;
open! BsMocha.Mocha;
open! BsMocha.Promise;
open Js.Promise;
open! Test__Util;

describe("Input Method", () => {
  open Instance__Type;

  describe("View", () => {
    after_each(Package.after_each);
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

  describe_only("Typing", () => {
    after_each(Package.after_each);

    it("should trigger onInputMethodActivationChange", () =>
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

    it({js|should result in "λ" after typing "gl"|js}, () =>
      openAndLoad("Temp.agda")
      |> then_(Keyboard.dispatch("\\"))
      |> then_(instance =>
           Keyboard.insert("G", instance)
           |> then_(_ => Keyboard.insert("l", instance))
           |> then_(_ => {
                instance.editors.source
                |> Atom.TextEditor.getText
                |> BsMocha.Assert.equal({js|λ|js});
                resolve();
              })
         )
    );

    it({js|should result in "ƛ" after typing "lambdabar"|js}, () =>
      openAndLoad("Temp.agda")
      |> then_(Keyboard.dispatch("\\"))
      |> then_(instance =>
           Keyboard.insert("l", instance)
           |> then_(_ => Keyboard.insert("a", instance))
           |> then_(_ => Keyboard.insert("m", instance))
           |> then_(_ => Keyboard.insert("b", instance))
           |> then_(_ => Keyboard.insert("d", instance))
           |> then_(_ => Keyboard.insert("a", instance))
           |> then_(_ => Keyboard.insert("b", instance))
           |> then_(_ => Keyboard.insert("a", instance))
           |> then_(_ => Keyboard.insert("r", instance))
           |> then_(_ => {
                instance.editors.source
                |> Atom.TextEditor.getText
                |> BsMocha.Assert.equal({js|ƛ|js});
                resolve();
              })
         )
    );

    it({js|should result in "λl" after typing "gll"|js}, () =>
      openAndLoad("Temp.agda")
      |> then_(Keyboard.dispatch("\\"))
      |> then_(instance =>
           Keyboard.insert("G", instance)
           |> then_(_ => Keyboard.insert("l", instance))
           |> then_(_ => Keyboard.insert("l", instance))
           |> then_(_ => {
                instance.editors.source
                |> Atom.TextEditor.getText
                |> BsMocha.Assert.equal({js|λl|js});
                resolve();
              })
         )
    );

    it({js|should result in "λ " after typing "gl "|js}, () =>
      openAndLoad("Temp.agda")
      |> then_(Keyboard.dispatch("\\"))
      |> then_(instance =>
           Keyboard.insert("G", instance)
           |> then_(_ => Keyboard.insert("l", instance))
           |> then_(_ => Keyboard.insert(" ", instance))
           |> then_(_ => {
                instance.editors.source
                |> Atom.TextEditor.getText
                |> BsMocha.Assert.equal({js|λ |js});
                resolve();
              })
         )
    );
    it({js|should result in "λ" after typing "gl" + "ESC"|js}, () =>
      openAndLoad("Temp.agda")
      |> then_(Keyboard.dispatch("\\"))
      |> then_(instance =>
           Keyboard.insert("G", instance)
           |> then_(_ => Keyboard.insert("l", instance))
           |> then_(_ => Keyboard.dispatch("escape", instance))
           |> then_(_ => {
                instance.editors.source
                |> Atom.TextEditor.getText
                |> BsMocha.Assert.equal({js|λ|js});
                resolve();
              })
         )
    );
  });
});
