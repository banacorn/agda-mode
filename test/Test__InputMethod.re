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

  describe("Typing", () => {
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
                     Assert.equal(true, activated);
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
                     Assert.equal(false, activated);
                     resolve(instance);
                   })
              );
         })
    );

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
                |> Assert.equal({js|ƛ|js});
                resolve();
              })
         )
    );
    it(
      {js|should result in "lamb" after typing "lambda" and then backspace twice|js},
      () =>
      openAndLoad("Temp.agda")
      |> then_(Keyboard.dispatch("\\"))
      |> then_(instance =>
           Keyboard.insert("l", instance)
           |> then_(_ => Keyboard.insert("a", instance))
           |> then_(_ => Keyboard.insert("m", instance))
           |> then_(_ => Keyboard.insert("b", instance))
           |> then_(_ => Keyboard.insert("d", instance))
           |> then_(_ => Keyboard.insert("a", instance))
           |> then_(_ => Keyboard.backspace(instance))
           |> then_(_ => Keyboard.backspace(instance))
           |> then_(_ => {
                instance.editors.source
                |> Atom.TextEditor.getText
                |> Assert.equal({js|lamb|js});
                resolve();
              })
         )
    );
    describe("Deactivation", () => {
      after_each(Package.after_each);

      it({js|should deactivate when stuck ("Gll")|js}, () =>
        openAndLoad("Temp.agda")
        |> then_(Keyboard.dispatch("\\"))
        |> then_(instance =>
             Keyboard.insert("G", instance)
             |> then_(_ => Keyboard.insert("l", instance))
             |> then_(_ => Keyboard.insert("l", instance))
             |> then_(_ => {
                  instance.editors.source
                  |> Atom.TextEditor.getText
                  |> Assert.equal({js|λl|js});
                  resolve();
                })
           )
      );

      it({js|should deactivate when stuck ("Gl ")|js}, () =>
        openAndLoad("Temp.agda")
        |> then_(Keyboard.dispatch("\\"))
        |> then_(instance =>
             Keyboard.insert("G", instance)
             |> then_(_ => Keyboard.insert("l", instance))
             |> then_(_ => Keyboard.insert(" ", instance))
             |> then_(_ => {
                  instance.editors.source
                  |> Atom.TextEditor.getText
                  |> Assert.equal({js|λ |js});
                  resolve();
                })
           )
      );

      it({js|should deactivate after typing "ESC" ("Gl" + "ESC")|js}, () =>
        openAndLoad("Temp.agda")
        |> then_(Keyboard.dispatch("\\"))
        |> then_(instance =>
             Keyboard.insert("G", instance)
             |> then_(_ => Keyboard.insert("l", instance))
             |> then_(_ => Keyboard.dispatch("escape", instance))
             |> then_(_ => {
                  instance.editors.source
                  |> Atom.TextEditor.getText
                  |> Assert.equal({js|λ|js});
                  resolve();
                })
           )
      );
      it({js|should deactivate after typing "ENTER" ("Gl" + "ENTER")|js}, () =>
        openAndLoad("Temp.agda")
        |> then_(Keyboard.dispatch("\\"))
        |> then_(instance =>
             Keyboard.insert("G", instance)
             |> then_(_ => Keyboard.insert("l", instance))
             |> then_(_ => Keyboard.insert("\n", instance))
             // |> then_(_ => Keyboard.dispatch("enter", instance))
             |> then_(_ => {
                  instance.editors.source
                  |> Atom.TextEditor.getText
                  |> Assert.equal({js|λ\n|js});
                  resolve();
                })
           )
      );
    });
  });

  describe("Typing", () => {
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
                     Assert.equal(true, activated);
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
                     Assert.equal(false, activated);
                     resolve(instance);
                   })
              );
         })
    );

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
                |> Assert.equal({js|ƛ|js});
                resolve();
              })
         )
    );
    it(
      {js|should result in "lamb" after typing "lambda" and then backspace twice|js},
      () =>
      openAndLoad("Temp.agda")
      |> then_(Keyboard.dispatch("\\"))
      |> then_(instance =>
           Keyboard.insert("l", instance)
           |> then_(_ => Keyboard.insert("a", instance))
           |> then_(_ => Keyboard.insert("m", instance))
           |> then_(_ => Keyboard.insert("b", instance))
           |> then_(_ => Keyboard.insert("d", instance))
           |> then_(_ => Keyboard.insert("a", instance))
           |> then_(_ => Keyboard.backspace(instance))
           |> then_(_ => Keyboard.backspace(instance))
           |> then_(_ => {
                instance.editors.source
                |> Atom.TextEditor.getText
                |> Assert.equal({js|lamb|js});
                resolve();
              })
         )
    );
    describe("Deactivation", () => {
      after_each(Package.after_each);

      it({js|should deactivate when stuck ("Gll")|js}, () =>
        openAndLoad("Temp.agda")
        |> then_(Keyboard.dispatch("\\"))
        |> then_(instance =>
             Keyboard.insert("G", instance)
             |> then_(_ => Keyboard.insert("l", instance))
             |> then_(_ => Keyboard.insert("l", instance))
             |> then_(_ => {
                  instance.editors.source
                  |> Atom.TextEditor.getText
                  |> Assert.equal({js|λl|js});
                  resolve();
                })
           )
      );

      it({js|should deactivate when stuck ("Gl ")|js}, () =>
        openAndLoad("Temp.agda")
        |> then_(Keyboard.dispatch("\\"))
        |> then_(instance =>
             Keyboard.insert("G", instance)
             |> then_(_ => Keyboard.insert("l", instance))
             |> then_(_ => Keyboard.insert(" ", instance))
             |> then_(_ => {
                  instance.editors.source
                  |> Atom.TextEditor.getText
                  |> Assert.equal({js|λ |js});
                  resolve();
                })
           )
      );

      it({js|should deactivate after typing "ESC" ("Gl" + "ESC")|js}, () =>
        openAndLoad("Temp.agda")
        |> then_(Keyboard.dispatch("\\"))
        |> then_(instance =>
             Keyboard.insert("G", instance)
             |> then_(_ => Keyboard.insert("l", instance))
             |> then_(_ => Keyboard.dispatch("escape", instance))
             |> then_(_ => {
                  instance.editors.source
                  |> Atom.TextEditor.getText
                  |> Assert.equal({js|λ|js});
                  resolve();
                })
           )
      );
      it({js|should deactivate after typing "ENTER" ("Gl" + "ENTER")|js}, () =>
        openAndLoad("Temp.agda")
        |> then_(Keyboard.dispatch("\\"))
        |> then_(instance =>
             Keyboard.insert("G", instance)
             |> then_(_ => Keyboard.insert("l", instance))
             |> then_(_ => Keyboard.insert("\n", instance))
             // |> then_(_ => Keyboard.dispatch("enter", instance))
             |> then_(_ => {
                  instance.editors.source
                  |> Atom.TextEditor.getText
                  |> Assert.equal({js|λ\n|js});
                  resolve();
                })
           )
      );
    });
  });

  describe("Typing", () => {
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
                     Assert.equal(true, activated);
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
                     Assert.equal(false, activated);
                     resolve(instance);
                   })
              );
         })
    );

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
                |> Assert.equal({js|ƛ|js});
                resolve();
              })
         )
    );
    it(
      {js|should result in "lamb" after typing "lambda" and then backspace twice|js},
      () =>
      openAndLoad("Temp.agda")
      |> then_(Keyboard.dispatch("\\"))
      |> then_(instance =>
           Keyboard.insert("l", instance)
           |> then_(_ => Keyboard.insert("a", instance))
           |> then_(_ => Keyboard.insert("m", instance))
           |> then_(_ => Keyboard.insert("b", instance))
           |> then_(_ => Keyboard.insert("d", instance))
           |> then_(_ => Keyboard.insert("a", instance))
           |> then_(_ => Keyboard.backspace(instance))
           |> then_(_ => Keyboard.backspace(instance))
           |> then_(_ => {
                instance.editors.source
                |> Atom.TextEditor.getText
                |> Assert.equal({js|lamb|js});
                resolve();
              })
         )
    );
    describe("Deactivation", () => {
      after_each(Package.after_each);

      it({js|should deactivate when stuck ("Gll")|js}, () =>
        openAndLoad("Temp.agda")
        |> then_(Keyboard.dispatch("\\"))
        |> then_(instance =>
             Keyboard.insert("G", instance)
             |> then_(_ => Keyboard.insert("l", instance))
             |> then_(_ => Keyboard.insert("l", instance))
             |> then_(_ => {
                  instance.editors.source
                  |> Atom.TextEditor.getText
                  |> Assert.equal({js|λl|js});
                  resolve();
                })
           )
      );

      it({js|should deactivate when stuck ("Gl ")|js}, () =>
        openAndLoad("Temp.agda")
        |> then_(Keyboard.dispatch("\\"))
        |> then_(instance =>
             Keyboard.insert("G", instance)
             |> then_(_ => Keyboard.insert("l", instance))
             |> then_(_ => Keyboard.insert(" ", instance))
             |> then_(_ => {
                  instance.editors.source
                  |> Atom.TextEditor.getText
                  |> Assert.equal({js|λ |js});
                  resolve();
                })
           )
      );

      it({js|should deactivate after typing "ESC" ("Gl" + "ESC")|js}, () =>
        openAndLoad("Temp.agda")
        |> then_(Keyboard.dispatch("\\"))
        |> then_(instance =>
             Keyboard.insert("G", instance)
             |> then_(_ => Keyboard.insert("l", instance))
             |> then_(_ => Keyboard.dispatch("escape", instance))
             |> then_(_ => {
                  instance.editors.source
                  |> Atom.TextEditor.getText
                  |> Assert.equal({js|λ|js});
                  resolve();
                })
           )
      );
      it({js|should deactivate after typing "ENTER" ("Gl" + "ENTER")|js}, () =>
        openAndLoad("Temp.agda")
        |> then_(Keyboard.dispatch("\\"))
        |> then_(instance =>
             Keyboard.insert("G", instance)
             |> then_(_ => Keyboard.insert("l", instance))
             |> then_(_ => Keyboard.insert("\n", instance))
             // |> then_(_ => Keyboard.dispatch("enter", instance))
             |> then_(_ => {
                  instance.editors.source
                  |> Atom.TextEditor.getText
                  |> Assert.equal({js|λ\n|js});
                  resolve();
                })
           )
      );
    });
  });

  describe("Typing", () => {
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
                     Assert.equal(true, activated);
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
                     Assert.equal(false, activated);
                     resolve(instance);
                   })
              );
         })
    );

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
                |> Assert.equal({js|ƛ|js});
                resolve();
              })
         )
    );
    it(
      {js|should result in "lamb" after typing "lambda" and then backspace twice|js},
      () =>
      openAndLoad("Temp.agda")
      |> then_(Keyboard.dispatch("\\"))
      |> then_(instance =>
           Keyboard.insert("l", instance)
           |> then_(_ => Keyboard.insert("a", instance))
           |> then_(_ => Keyboard.insert("m", instance))
           |> then_(_ => Keyboard.insert("b", instance))
           |> then_(_ => Keyboard.insert("d", instance))
           |> then_(_ => Keyboard.insert("a", instance))
           |> then_(_ => Keyboard.backspace(instance))
           |> then_(_ => Keyboard.backspace(instance))
           |> then_(_ => {
                instance.editors.source
                |> Atom.TextEditor.getText
                |> Assert.equal({js|lamb|js});
                resolve();
              })
         )
    );
    describe("Deactivation", () => {
      after_each(Package.after_each);

      it({js|should deactivate when stuck ("Gll")|js}, () =>
        openAndLoad("Temp.agda")
        |> then_(Keyboard.dispatch("\\"))
        |> then_(instance =>
             Keyboard.insert("G", instance)
             |> then_(_ => Keyboard.insert("l", instance))
             |> then_(_ => Keyboard.insert("l", instance))
             |> then_(_ => {
                  instance.editors.source
                  |> Atom.TextEditor.getText
                  |> Assert.equal({js|λl|js});
                  resolve();
                })
           )
      );

      it({js|should deactivate when stuck ("Gl ")|js}, () =>
        openAndLoad("Temp.agda")
        |> then_(Keyboard.dispatch("\\"))
        |> then_(instance =>
             Keyboard.insert("G", instance)
             |> then_(_ => Keyboard.insert("l", instance))
             |> then_(_ => Keyboard.insert(" ", instance))
             |> then_(_ => {
                  instance.editors.source
                  |> Atom.TextEditor.getText
                  |> Assert.equal({js|λ |js});
                  resolve();
                })
           )
      );

      it({js|should deactivate after typing "ESC" ("Gl" + "ESC")|js}, () =>
        openAndLoad("Temp.agda")
        |> then_(Keyboard.dispatch("\\"))
        |> then_(instance =>
             Keyboard.insert("G", instance)
             |> then_(_ => Keyboard.insert("l", instance))
             |> then_(_ => Keyboard.dispatch("escape", instance))
             |> then_(_ => {
                  instance.editors.source
                  |> Atom.TextEditor.getText
                  |> Assert.equal({js|λ|js});
                  resolve();
                })
           )
      );
      it({js|should deactivate after typing "ENTER" ("Gl" + "ENTER")|js}, () =>
        openAndLoad("Temp.agda")
        |> then_(Keyboard.dispatch("\\"))
        |> then_(instance =>
             Keyboard.insert("G", instance)
             |> then_(_ => Keyboard.insert("l", instance))
             |> then_(_ => Keyboard.insert("\n", instance))
             // |> then_(_ => Keyboard.dispatch("enter", instance))
             |> then_(_ => {
                  instance.editors.source
                  |> Atom.TextEditor.getText
                  |> Assert.equal({js|λ\n|js});
                  resolve();
                })
           )
      );
    });
  });

  describe("Typing", () => {
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
                     Assert.equal(true, activated);
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
                     Assert.equal(false, activated);
                     resolve(instance);
                   })
              );
         })
    );

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
                |> Assert.equal({js|ƛ|js});
                resolve();
              })
         )
    );
    it(
      {js|should result in "lamb" after typing "lambda" and then backspace twice|js},
      () =>
      openAndLoad("Temp.agda")
      |> then_(Keyboard.dispatch("\\"))
      |> then_(instance =>
           Keyboard.insert("l", instance)
           |> then_(_ => Keyboard.insert("a", instance))
           |> then_(_ => Keyboard.insert("m", instance))
           |> then_(_ => Keyboard.insert("b", instance))
           |> then_(_ => Keyboard.insert("d", instance))
           |> then_(_ => Keyboard.insert("a", instance))
           |> then_(_ => Keyboard.backspace(instance))
           |> then_(_ => Keyboard.backspace(instance))
           |> then_(_ => {
                instance.editors.source
                |> Atom.TextEditor.getText
                |> Assert.equal({js|lamb|js});
                resolve();
              })
         )
    );
    describe("Deactivation", () => {
      after_each(Package.after_each);

      it({js|should deactivate when stuck ("Gll")|js}, () =>
        openAndLoad("Temp.agda")
        |> then_(Keyboard.dispatch("\\"))
        |> then_(instance =>
             Keyboard.insert("G", instance)
             |> then_(_ => Keyboard.insert("l", instance))
             |> then_(_ => Keyboard.insert("l", instance))
             |> then_(_ => {
                  instance.editors.source
                  |> Atom.TextEditor.getText
                  |> Assert.equal({js|λl|js});
                  resolve();
                })
           )
      );

      it({js|should deactivate when stuck ("Gl ")|js}, () =>
        openAndLoad("Temp.agda")
        |> then_(Keyboard.dispatch("\\"))
        |> then_(instance =>
             Keyboard.insert("G", instance)
             |> then_(_ => Keyboard.insert("l", instance))
             |> then_(_ => Keyboard.insert(" ", instance))
             |> then_(_ => {
                  instance.editors.source
                  |> Atom.TextEditor.getText
                  |> Assert.equal({js|λ |js});
                  resolve();
                })
           )
      );

      it({js|should deactivate after typing "ESC" ("Gl" + "ESC")|js}, () =>
        openAndLoad("Temp.agda")
        |> then_(Keyboard.dispatch("\\"))
        |> then_(instance =>
             Keyboard.insert("G", instance)
             |> then_(_ => Keyboard.insert("l", instance))
             |> then_(_ => Keyboard.dispatch("escape", instance))
             |> then_(_ => {
                  instance.editors.source
                  |> Atom.TextEditor.getText
                  |> Assert.equal({js|λ|js});
                  resolve();
                })
           )
      );
      it({js|should deactivate after typing "ENTER" ("Gl" + "ENTER")|js}, () =>
        openAndLoad("Temp.agda")
        |> then_(Keyboard.dispatch("\\"))
        |> then_(instance =>
             Keyboard.insert("G", instance)
             |> then_(_ => Keyboard.insert("l", instance))
             |> then_(_ => Keyboard.insert("\n", instance))
             // |> then_(_ => Keyboard.dispatch("enter", instance))
             |> then_(_ => {
                  instance.editors.source
                  |> Atom.TextEditor.getText
                  |> Assert.equal({js|λ\n|js});
                  resolve();
                })
           )
      );
    });
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
