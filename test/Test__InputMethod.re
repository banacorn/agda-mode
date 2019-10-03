open Rebase;
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
           |> Assert.equal(false);
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
           |> Assert.equal(true);
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
                |> Assert.equal(true);
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
                |> Assert.equal(false);
                resolve();
              })
         )
    );
  });

  describe_only("Typing", () => {
    after_each(Package.after_each);

    it({js|should result in "λ" after typing "Gl"|js}, () =>
      openAndLoad("Temp.agda")
      |> then_(Keyboard.dispatch("\\"))
      |> then_(instance =>
           Keyboard.insert("G", instance)
           |> then_(_ => Keyboard.insert("l", instance))
           |> then_(_ => {
                instance.editors.source
                |> Atom.TextEditor.getText
                |> Assert.equal({js|λ|js});
                resolve();
              })
         )
    );

    it({js|should result in "ƛ" after typing "lambdabar"|js}, () =>
      openAndLoad("Temp.agda")
      |> then_(Keyboard.dispatch("\\"))
      |> then_(Keyboard.insert("l"))
      |> then_(Keyboard.insert("a"))
      |> then_(Keyboard.insert("m"))
      |> then_(Keyboard.insert("b"))
      |> then_(Keyboard.insert("d"))
      |> then_(Keyboard.insert("a"))
      |> then_(Keyboard.insert("b"))
      |> then_(Keyboard.insert("a"))
      |> then_(Keyboard.insert("r"))
      |> then_(instance => {
           instance.editors.source
           |> Atom.TextEditor.getText
           |> Assert.equal({js|ƛ|js});
           resolve();
         })
    );
    it(
      {js|should result in "lamb" after typing "lambda" and then backspace twice|js},
      () =>
      openAndLoad("Temp.agda")
      |> then_(Keyboard.dispatch("\\"))
      |> then_(Keyboard.insert("l"))
      |> then_(Keyboard.insert("a"))
      |> then_(Keyboard.insert("m"))
      |> then_(Keyboard.insert("b"))
      |> then_(Keyboard.insert("d"))
      |> then_(Keyboard.insert("a"))
      |> then_(Keyboard.backspace)
      |> then_(Keyboard.backspace)
      |> then_(instance => {
           instance.editors.source
           |> Atom.TextEditor.getText
           |> Assert.equal({js|lamb|js});
           resolve();
         })
    );

    it(
      {js|should result in "lamb" after typing "lambda" and then backspace twice|js},
      () =>
      openAndLoad("Temp.agda")
      |> then_(Keyboard.dispatch("\\"))
      |> then_(Keyboard.insert("l"))
      |> then_(Keyboard.insert("a"))
      |> then_(Keyboard.insert("m"))
      |> then_(Keyboard.insert("b"))
      |> then_(Keyboard.insert("d"))
      |> then_(Keyboard.insert("a"))
      |> then_(Keyboard.backspace)
      |> then_(Keyboard.backspace)
      |> then_(instance => {
           instance.editors.source
           |> Atom.TextEditor.getText
           |> Assert.equal({js|lamb|js});
           resolve();
         })
    );
    it(
      {js|should result in "lamb" after typing "lambda" and then backspace twice|js},
      () =>
      openAndLoad("Temp.agda")
      |> then_(Keyboard.dispatch("\\"))
      |> then_(Keyboard.insert("l"))
      |> then_(Keyboard.insert("a"))
      |> then_(Keyboard.insert("m"))
      |> then_(Keyboard.insert("b"))
      |> then_(Keyboard.insert("d"))
      |> then_(Keyboard.insert("a"))
      |> then_(Keyboard.backspace)
      |> then_(Keyboard.backspace)
      |> then_(instance => {
           instance.editors.source
           |> Atom.TextEditor.getText
           |> Assert.equal({js|lamb|js});
           resolve();
         })
    );
    it(
      {js|should result in "lamb" after typing "lambda" and then backspace twice|js},
      () =>
      openAndLoad("Temp.agda")
      |> then_(Keyboard.dispatch("\\"))
      |> then_(Keyboard.insert("l"))
      |> then_(Keyboard.insert("a"))
      |> then_(Keyboard.insert("m"))
      |> then_(Keyboard.insert("b"))
      |> then_(Keyboard.insert("d"))
      |> then_(Keyboard.insert("a"))
      |> then_(Keyboard.backspace)
      |> then_(Keyboard.backspace)
      |> then_(instance => {
           instance.editors.source
           |> Atom.TextEditor.getText
           |> Assert.equal({js|lamb|js});
           resolve();
         })
    );
    it(
      {js|should result in "lamb" after typing "lambda" and then backspace twice|js},
      () =>
      openAndLoad("Temp.agda")
      |> then_(Keyboard.dispatch("\\"))
      |> then_(Keyboard.insert("l"))
      |> then_(Keyboard.insert("a"))
      |> then_(Keyboard.insert("m"))
      |> then_(Keyboard.insert("b"))
      |> then_(Keyboard.insert("d"))
      |> then_(Keyboard.insert("a"))
      |> then_(Keyboard.backspace)
      |> then_(Keyboard.backspace)
      |> then_(instance => {
           instance.editors.source
           |> Atom.TextEditor.getText
           |> Assert.equal({js|lamb|js});
           resolve();
         })
    );
    it(
      {js|should result in "lamb" after typing "lambda" and then backspace twice|js},
      () =>
      openAndLoad("Temp.agda")
      |> then_(Keyboard.dispatch("\\"))
      |> then_(Keyboard.insert("l"))
      |> then_(Keyboard.insert("a"))
      |> then_(Keyboard.insert("m"))
      |> then_(Keyboard.insert("b"))
      |> then_(Keyboard.insert("d"))
      |> then_(Keyboard.insert("a"))
      |> then_(Keyboard.backspace)
      |> then_(Keyboard.backspace)
      |> then_(instance => {
           instance.editors.source
           |> Atom.TextEditor.getText
           |> Assert.equal({js|lamb|js});
           resolve();
         })
    );
    it(
      {js|should result in "lamb" after typing "lambda" and then backspace twice|js},
      () =>
      openAndLoad("Temp.agda")
      |> then_(Keyboard.dispatch("\\"))
      |> then_(Keyboard.insert("l"))
      |> then_(Keyboard.insert("a"))
      |> then_(Keyboard.insert("m"))
      |> then_(Keyboard.insert("b"))
      |> then_(Keyboard.insert("d"))
      |> then_(Keyboard.insert("a"))
      |> then_(Keyboard.backspace)
      |> then_(Keyboard.backspace)
      |> then_(instance => {
           instance.editors.source
           |> Atom.TextEditor.getText
           |> Assert.equal({js|lamb|js});
           resolve();
         })
    );
    it(
      {js|should result in "lamb" after typing "lambda" and then backspace twice|js},
      () =>
      openAndLoad("Temp.agda")
      |> then_(Keyboard.dispatch("\\"))
      |> then_(Keyboard.insert("l"))
      |> then_(Keyboard.insert("a"))
      |> then_(Keyboard.insert("m"))
      |> then_(Keyboard.insert("b"))
      |> then_(Keyboard.insert("d"))
      |> then_(Keyboard.insert("a"))
      |> then_(Keyboard.backspace)
      |> then_(Keyboard.backspace)
      |> then_(instance => {
           instance.editors.source
           |> Atom.TextEditor.getText
           |> Assert.equal({js|lamb|js});
           resolve();
         })
    );
    it(
      {js|should result in "lamb" after typing "lambda" and then backspace twice|js},
      () =>
      openAndLoad("Temp.agda")
      |> then_(Keyboard.dispatch("\\"))
      |> then_(Keyboard.insert("l"))
      |> then_(Keyboard.insert("a"))
      |> then_(Keyboard.insert("m"))
      |> then_(Keyboard.insert("b"))
      |> then_(Keyboard.insert("d"))
      |> then_(Keyboard.insert("a"))
      |> then_(Keyboard.backspace)
      |> then_(Keyboard.backspace)
      |> then_(instance => {
           instance.editors.source
           |> Atom.TextEditor.getText
           |> Assert.equal({js|lamb|js});
           resolve();
         })
    );
    it(
      {js|should result in "lamb" after typing "lambda" and then backspace twice|js},
      () =>
      openAndLoad("Temp.agda")
      |> then_(Keyboard.dispatch("\\"))
      |> then_(Keyboard.insert("l"))
      |> then_(Keyboard.insert("a"))
      |> then_(Keyboard.insert("m"))
      |> then_(Keyboard.insert("b"))
      |> then_(Keyboard.insert("d"))
      |> then_(Keyboard.insert("a"))
      |> then_(Keyboard.backspace)
      |> then_(Keyboard.backspace)
      |> then_(instance => {
           instance.editors.source
           |> Atom.TextEditor.getText
           |> Assert.equal({js|lamb|js});
           resolve();
         })
    );
    it(
      {js|should result in "lamb" after typing "lambda" and then backspace twice|js},
      () =>
      openAndLoad("Temp.agda")
      |> then_(Keyboard.dispatch("\\"))
      |> then_(Keyboard.insert("l"))
      |> then_(Keyboard.insert("a"))
      |> then_(Keyboard.insert("m"))
      |> then_(Keyboard.insert("b"))
      |> then_(Keyboard.insert("d"))
      |> then_(Keyboard.insert("a"))
      |> then_(Keyboard.backspace)
      |> then_(Keyboard.backspace)
      |> then_(instance => {
           instance.editors.source
           |> Atom.TextEditor.getText
           |> Assert.equal({js|lamb|js});
           resolve();
         })
    );
    it(
      {js|should result in "lamb" after typing "lambda" and then backspace twice|js},
      () =>
      openAndLoad("Temp.agda")
      |> then_(Keyboard.dispatch("\\"))
      |> then_(Keyboard.insert("l"))
      |> then_(Keyboard.insert("a"))
      |> then_(Keyboard.insert("m"))
      |> then_(Keyboard.insert("b"))
      |> then_(Keyboard.insert("d"))
      |> then_(Keyboard.insert("a"))
      |> then_(Keyboard.backspace)
      |> then_(Keyboard.backspace)
      |> then_(instance => {
           instance.editors.source
           |> Atom.TextEditor.getText
           |> Assert.equal({js|lamb|js});
           resolve();
         })
    );
  });

  describe("Activation/Deactivation", () => {
    after_each(Package.after_each);

    it({js|should be activated after typing "\\"|js}, () =>
      openAndLoad("Temp.agda")
      |> then_(instance => {
           let onDispatch =
             instance.view.onInputMethodActivationChange
             |> Event.once
             |> Async.toPromise;

           // dispatch!
           instance
           |> Keyboard.dispatch("\\")
           |> then_(_ => onDispatch)
           |> then_(activated => {
                Assert.equal(true, activated);
                resolve(instance);
              });
         })
    );

    it({js|should be deactivated after typing "\\" twice|js}, () =>
      openAndLoad("Temp.agda")
      |> then_(instance => {
           let onDispatch =
             instance.view.onInputMethodActivationChange
             |> Event.once
             |> Async.toPromise;
           // dispatch!
           instance
           |> Keyboard.dispatch("\\")
           |> then_(_ => onDispatch)
           |> then_(_ => resolve(instance));
         })
      |> then_(instance => {
           let onDispatch =
             instance.view.onInputMethodActivationChange
             |> Event.once
             |> Async.toPromise;

           // dispatch!
           instance
           |> Keyboard.insert("\\")
           |> then_(_ => onDispatch)
           |> then_(activated => {
                // should be deactivated
                Assert.equal(false, activated);
                // should result in "\"
                instance.editors.source
                |> Atom.TextEditor.getText
                |> Assert.equal({js|\\|js});
                resolve(instance);
              });
         })
    );

    describe("Issue #102", () => {
      after_each(Package.after_each);

      it(
        {js|should be reactivated after typing "\\" even if the previous sequence can go further|js},
        () =>
        openAndLoad("Temp.agda")
        |> then_(Keyboard.dispatch("\\"))
        |> then_(Keyboard.insert("="))
        |> then_(Keyboard.insert("="))
        |> then_(Keyboard.dispatch("\\"))
        |> then_(Keyboard.insert("="))
        |> then_(Keyboard.insert("="))
        |> then_(Keyboard.dispatch("\\"))
        |> then_(Keyboard.insert("<"))
        |> then_(Keyboard.dispatch("\\"))
        |> then_(Keyboard.insert(">"))
        |> then_(instance => {
             instance.editors.source
             |> Atom.TextEditor.getText
             |> Assert.equal({js|≡≡⟨⟩|js});
             resolve();
           })
      );
    });

    it({js|should deactivate when stuck ("Gll")|js}, () =>
      openAndLoad("Temp.agda")
      |> then_(Keyboard.dispatch("\\"))
      |> then_(Keyboard.insert("G"))
      |> then_(Keyboard.insert("l"))
      |> then_(Keyboard.insert("l"))
      |> then_(instance => {
           instance.editors.source
           |> Atom.TextEditor.getText
           |> Assert.equal({js|λl|js});
           resolve();
         })
    );

    it({js|should deactivate when stuck ("Gl ")|js}, () =>
      openAndLoad("Temp.agda")
      |> then_(Keyboard.dispatch("\\"))
      |> then_(Keyboard.insert("G"))
      |> then_(Keyboard.insert("l"))
      |> then_(Keyboard.insert(" "))
      |> then_(instance => {
           instance.editors.source
           |> Atom.TextEditor.getText
           |> Assert.equal({js|λ |js});
           resolve();
         })
    );

    it({js|should deactivate after typing "ESC" ("Gl" + "ESC")|js}, () =>
      openAndLoad("Temp.agda")
      |> then_(Keyboard.dispatch("\\"))
      |> then_(Keyboard.insert("G"))
      |> then_(Keyboard.insert("l"))
      |> then_(Keyboard.dispatch("escape"))
      |> then_(instance => {
           instance.editors.source
           |> Atom.TextEditor.getText
           |> Assert.equal({js|λ|js});
           resolve();
         })
    );
    it({js|should deactivate after typing "ENTER" ("Gl" + "ENTER")|js}, () =>
      openAndLoad("Temp.agda")
      |> then_(Keyboard.dispatch("\\"))
      |> then_(Keyboard.insert("G"))
      |> then_(Keyboard.insert("l"))
      |> then_(Keyboard.insert("\n"))
      |> then_(instance => {
           instance.editors.source
           |> Atom.TextEditor.getText
           |> Assert.equal({js|λ\n|js});
           resolve();
         })
    );
  });

  describe("Issue #72", () => {
    after_each(Package.after_each);
    it({js|should make "ʳ" the first candidate|js}, () => {
      Translator.translate("^r").candidateSymbols[0]
      |> Assert.equal(Some({js|ʳ|js}));
      resolve();
      // openAndLoad("Temp.agda")
      // |> then_(Keyboard.insertUntilSuccess("a"))
      // |> then_(Keyboard.dispatch("\\"))
      // |> then_(instance =>
      //      Keyboard.insert("^", instance)
      //      |> then_(_ => Keyboard.insert("r", instance))
      //      |> then_(_ => {
      //           instance.editors.source
      //           |> Atom.TextEditor.getText
      //           |> Assert.equal({js|aʳ|js});
      //           resolve();
      //         })
      //    );
    });
    it({js|should make "ˡ" the first candidate|js}, () => {
      Translator.translate("^l").candidateSymbols[0]
      |> Assert.equal(Some({js|ˡ|js}));
      resolve();
      //
      // openAndLoad("Temp.agda")
      // |> then_(Keyboard.insertUntilSuccess("a"))
      // |> then_(Keyboard.dispatch("\\"))
      // |> then_(instance =>
      //      Keyboard.insert("^", instance)
      //      |> then_(_ => Keyboard.insert("l", instance))
      //      |> then_(_ => {
      //           instance.editors.source
      //           |> Atom.TextEditor.getText
      //           |> Assert.equal({js|aˡ|js});
      //           resolve();
      //         })
      //    );
    });
  });
});
