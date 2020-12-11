// Generated by BUCKLESCRIPT, PLEASE EDIT WITH CARE
'use strict';

var Curry = require("bs-platform/lib/js/curry.js");
var Rebase = require("@glennsl/rebase/lib/js/src/Rebase.bs.js");
var $$Promise = require("reason-promise/lib/js/src/js/promise.js");
var Caml_obj = require("bs-platform/lib/js/caml_obj.js");
var Mocha$BsMocha = require("bs-mocha/lib/js/src/Mocha.bs.js");
var Promise$BsMocha = require("bs-mocha/lib/js/src/Promise.bs.js");
var Extension$AgdaMode = require("../src/View/Panel/InputMethod/Extension.bs.js");
var Test__Util$AgdaMode = require("./Test__Util.bs.js");
var Translator$AgdaMode = require("../src/View/Panel/InputMethod/Translator.bs.js");

Mocha$BsMocha.describe("Input Method")(undefined, undefined, undefined, (function (param) {
        Mocha$BsMocha.describe("View")(undefined, undefined, undefined, (function (param) {
                Promise$BsMocha.after_each(undefined)(undefined, undefined, undefined, Test__Util$AgdaMode.Package.after_each);
                Promise$BsMocha.it("should not add class '.agda-mode-input-method-activated' to the editor element before triggering")(undefined, undefined, undefined, (function (param) {
                        return Test__Util$AgdaMode.openAndLoad("Temp.agda").then((function (instance) {
                                      Test__Util$AgdaMode.Assert.no(atom.views.getView(instance.editors.source).classList.contains("agda-mode-input-method-activated"));
                                      return Promise.resolve(/* () */0);
                                    }));
                      }));
                Promise$BsMocha.it("should add class '.agda-mode-input-method-activated' to the editor element after triggering")(undefined, undefined, undefined, (function (param) {
                        return Test__Util$AgdaMode.openAndLoad("Temp.agda").then((function (param) {
                                        return Test__Util$AgdaMode.Keyboard.dispatch("\\", param);
                                      })).then((function (instance) {
                                      Test__Util$AgdaMode.Assert.yes(atom.views.getView(instance.editors.source).classList.contains("agda-mode-input-method-activated"));
                                      return Promise.resolve(/* () */0);
                                    }));
                      }));
                return Promise$BsMocha.it("should display the keyboard after triggering")(undefined, undefined, undefined, (function (param) {
                              return Test__Util$AgdaMode.openAndLoad("Temp.agda").then((function (instance) {
                                                return Test__Util$AgdaMode.View.getPanel(instance).then((function (param) {
                                                                return Test__Util$AgdaMode.View.querySelector(".input-method", param);
                                                              })).then((function (element) {
                                                              Test__Util$AgdaMode.Assert.yes(element.classList.contains("hidden"));
                                                              return Promise.resolve(instance);
                                                            }));
                                              })).then((function (param) {
                                              return Test__Util$AgdaMode.Keyboard.dispatch("\\", param);
                                            })).then((function (instance) {
                                            return Test__Util$AgdaMode.View.getPanel(instance).then((function (param) {
                                                            return Test__Util$AgdaMode.View.querySelector(".input-method", param);
                                                          })).then((function (element) {
                                                          Test__Util$AgdaMode.Assert.no(element.classList.contains("hidden"));
                                                          return Promise.resolve(/* () */0);
                                                        }));
                                          }));
                            }));
              }));
        Mocha$BsMocha.describe("Typing")(undefined, undefined, undefined, (function (param) {
                Promise$BsMocha.after_each(undefined)(undefined, undefined, undefined, Test__Util$AgdaMode.Package.after_each);
                Promise$BsMocha.it("should result in \"λ\" after typing \"Gl\"")(undefined, undefined, undefined, (function (param) {
                        return Test__Util$AgdaMode.openAndLoad("Temp.agda").then((function (param) {
                                        return Test__Util$AgdaMode.Keyboard.dispatch("\\", param);
                                      })).then((function (instance) {
                                      return Test__Util$AgdaMode.Keyboard.insert("G", instance).then((function (param) {
                                                      return Test__Util$AgdaMode.Keyboard.insert("l", instance);
                                                    })).then((function (param) {
                                                    Test__Util$AgdaMode.Assert.equal(undefined, "λ", instance.editors.source.getText());
                                                    return Promise.resolve(/* () */0);
                                                  }));
                                    }));
                      }));
                Promise$BsMocha.it("should result in \"ƛ\" after typing \"lambdabar\"")(undefined, undefined, undefined, (function (param) {
                        return Test__Util$AgdaMode.openAndLoad("Temp.agda").then((function (param) {
                                                          return Test__Util$AgdaMode.Keyboard.dispatch("\\", param);
                                                        })).then((function (param) {
                                                        return Test__Util$AgdaMode.Keyboard.insert("l", param);
                                                      })).then((function (param) {
                                                      return Test__Util$AgdaMode.Keyboard.insert("a", param);
                                                    })).then((function (param) {
                                                    return Test__Util$AgdaMode.Keyboard.insert("m", param);
                                                  })).then((function (param) {
                                                  return Test__Util$AgdaMode.Keyboard.insert("b", param);
                                                })).then((function (param) {
                                                return Test__Util$AgdaMode.Keyboard.insert("d", param);
                                              })).then((function (param) {
                                              return Test__Util$AgdaMode.Keyboard.insert("a", param);
                                            })).then((function (param) {
                                            return Test__Util$AgdaMode.Keyboard.insert("b", param);
                                          })).then((function (param) {
                                          return Test__Util$AgdaMode.Keyboard.insert("a", param);
                                        })).then((function (param) {
                                        return Test__Util$AgdaMode.Keyboard.insert("r", param);
                                      })).then((function (instance) {
                                      Test__Util$AgdaMode.Assert.equal(undefined, "ƛ", instance.editors.source.getText());
                                      return Promise.resolve(/* () */0);
                                    }));
                      }));
                return Promise$BsMocha.it("should result in \"lamb\" after typing \"lambda\" and then backspace twice")(undefined, undefined, undefined, (function (param) {
                              return Test__Util$AgdaMode.openAndLoad("Temp.agda").then((function (param) {
                                                              return Test__Util$AgdaMode.Keyboard.dispatch("\\", param);
                                                            })).then((function (param) {
                                                            return Test__Util$AgdaMode.Keyboard.insert("l", param);
                                                          })).then((function (param) {
                                                          return Test__Util$AgdaMode.Keyboard.insert("a", param);
                                                        })).then((function (param) {
                                                        return Test__Util$AgdaMode.Keyboard.insert("m", param);
                                                      })).then((function (param) {
                                                      return Test__Util$AgdaMode.Keyboard.insert("b", param);
                                                    })).then((function (param) {
                                                    return Test__Util$AgdaMode.Keyboard.insert("d", param);
                                                  })).then((function (param) {
                                                  return Test__Util$AgdaMode.Keyboard.insert("a", param);
                                                })).then(Test__Util$AgdaMode.Keyboard.backspace).then(Test__Util$AgdaMode.Keyboard.backspace).then((function (instance) {
                                            Test__Util$AgdaMode.Assert.equal(undefined, "lamb", instance.editors.source.getText());
                                            return Promise.resolve(/* () */0);
                                          }));
                            }));
              }));
        Mocha$BsMocha.describe("Activation/Deactivation")(undefined, undefined, undefined, (function (param) {
                Promise$BsMocha.after_each(undefined)(undefined, undefined, undefined, Test__Util$AgdaMode.Package.after_each);
                Promise$BsMocha.it("should be activated after typing \"\\\"")(undefined, undefined, undefined, (function (param) {
                        return Test__Util$AgdaMode.openAndLoad("Temp.agda").then((function (instance) {
                                      var onDispatch = $$Promise.Js.toBsPromise(Curry._1(instance.view.onInputMethodChange.once, /* () */0));
                                      return Test__Util$AgdaMode.Keyboard.dispatch("\\", instance).then((function (param) {
                                                      return onDispatch;
                                                    })).then((function (state) {
                                                    Test__Util$AgdaMode.Assert.equal(undefined, true, state.activated);
                                                    return Promise.resolve(instance);
                                                  }));
                                    }));
                      }));
                Promise$BsMocha.it("should be deactivated after typing \"\\\" twice")(undefined, undefined, undefined, (function (param) {
                        return Test__Util$AgdaMode.openAndLoad("Temp.agda").then((function (instance) {
                                        var onDispatch = $$Promise.Js.toBsPromise(Curry._1(instance.view.onInputMethodChange.once, /* () */0));
                                        return Test__Util$AgdaMode.Keyboard.dispatch("\\", instance).then((function (param) {
                                                        return onDispatch;
                                                      })).then((function (param) {
                                                      return Promise.resolve(instance);
                                                    }));
                                      })).then((function (instance) {
                                      var onDispatch = $$Promise.Js.toBsPromise(Curry._1(instance.view.onInputMethodChange.once, /* () */0));
                                      return Test__Util$AgdaMode.Keyboard.insert("\\", instance).then((function (param) {
                                                      return onDispatch;
                                                    })).then((function (state) {
                                                    Test__Util$AgdaMode.Assert.equal(undefined, false, state.activated);
                                                    Test__Util$AgdaMode.Assert.equal(undefined, "\\", instance.editors.source.getText());
                                                    return Promise.resolve(instance);
                                                  }));
                                    }));
                      }));
                Mocha$BsMocha.describe("Issue #102")(undefined, undefined, undefined, (function (param) {
                        Promise$BsMocha.after_each(undefined)(undefined, undefined, undefined, Test__Util$AgdaMode.Package.after_each);
                        return Promise$BsMocha.it("should be reactivated after typing \"\\\" even if the previous sequence can go further")(undefined, undefined, undefined, (function (param) {
                                      return Test__Util$AgdaMode.openAndLoad("Temp.agda").then((function (param) {
                                                                        return Test__Util$AgdaMode.Keyboard.dispatch("\\", param);
                                                                      })).then((function (param) {
                                                                      return Test__Util$AgdaMode.Keyboard.insert("=", param);
                                                                    })).then((function (param) {
                                                                    return Test__Util$AgdaMode.Keyboard.insert("=", param);
                                                                  })).then((function (param) {
                                                                  return Test__Util$AgdaMode.Keyboard.dispatch("\\", param);
                                                                })).then((function (param) {
                                                                return Test__Util$AgdaMode.Keyboard.insert("=", param);
                                                              })).then((function (param) {
                                                              return Test__Util$AgdaMode.Keyboard.insert("=", param);
                                                            })).then((function (param) {
                                                            return Test__Util$AgdaMode.Keyboard.dispatch("\\", param);
                                                          })).then((function (param) {
                                                          return Test__Util$AgdaMode.Keyboard.insert("<", param);
                                                        })).then((function (param) {
                                                        return Test__Util$AgdaMode.Keyboard.dispatch("\\", param);
                                                      })).then((function (param) {
                                                      return Test__Util$AgdaMode.Keyboard.insert(">", param);
                                                    })).then((function (instance) {
                                                    Test__Util$AgdaMode.Assert.equal(undefined, "≡≡⟨⟩", instance.editors.source.getText());
                                                    return Promise.resolve(/* () */0);
                                                  }));
                                    }));
                      }));
                Promise$BsMocha.it("should deactivate when stuck (\"Gll\")")(undefined, undefined, undefined, (function (param) {
                        return Test__Util$AgdaMode.openAndLoad("Temp.agda").then((function (param) {
                                              return Test__Util$AgdaMode.Keyboard.dispatch("\\", param);
                                            })).then((function (param) {
                                            return Test__Util$AgdaMode.Keyboard.insert("G", param);
                                          })).then((function (param) {
                                          return Test__Util$AgdaMode.Keyboard.insert("l", param);
                                        })).then((function (param) {
                                        return Test__Util$AgdaMode.Keyboard.insert("l", param);
                                      })).then((function (instance) {
                                      Test__Util$AgdaMode.Assert.equal(undefined, "λl", instance.editors.source.getText());
                                      return Promise.resolve(/* () */0);
                                    }));
                      }));
                Promise$BsMocha.it("should deactivate when stuck (\"Gl \")")(undefined, undefined, undefined, (function (param) {
                        return Test__Util$AgdaMode.openAndLoad("Temp.agda").then((function (param) {
                                              return Test__Util$AgdaMode.Keyboard.dispatch("\\", param);
                                            })).then((function (param) {
                                            return Test__Util$AgdaMode.Keyboard.insert("G", param);
                                          })).then((function (param) {
                                          return Test__Util$AgdaMode.Keyboard.insert("l", param);
                                        })).then((function (param) {
                                        return Test__Util$AgdaMode.Keyboard.insert(" ", param);
                                      })).then((function (instance) {
                                      Test__Util$AgdaMode.Assert.equal(undefined, "λ ", instance.editors.source.getText());
                                      return Promise.resolve(/* () */0);
                                    }));
                      }));
                Promise$BsMocha.it("should deactivate after typing \"ESC\" immediately")(undefined, undefined, undefined, (function (param) {
                        return Test__Util$AgdaMode.openAndLoad("Temp.agda").then((function (param) {
                                          return Test__Util$AgdaMode.Keyboard.dispatch("\\", param);
                                        })).then((function (instance) {
                                        var onEscaped = $$Promise.Js.toBsPromise(Curry._1(instance.view.onInputMethodChange.once, /* () */0));
                                        return Test__Util$AgdaMode.Keyboard.dispatch("escape", instance).then((function (param) {
                                                      return onEscaped;
                                                    }));
                                      })).then((function (state) {
                                      Test__Util$AgdaMode.Assert.equal(undefined, false, state.activated);
                                      return Promise.resolve(/* () */0);
                                    }));
                      }));
                Promise$BsMocha.it("should deactivate after typing \"ESC\" (\"Gl\" + \"ESC\")")(undefined, undefined, undefined, (function (param) {
                        return Test__Util$AgdaMode.openAndLoad("Temp.agda").then((function (param) {
                                              return Test__Util$AgdaMode.Keyboard.dispatch("\\", param);
                                            })).then((function (param) {
                                            return Test__Util$AgdaMode.Keyboard.insert("G", param);
                                          })).then((function (param) {
                                          return Test__Util$AgdaMode.Keyboard.insert("l", param);
                                        })).then((function (param) {
                                        return Test__Util$AgdaMode.Keyboard.dispatch("escape", param);
                                      })).then((function (instance) {
                                      Test__Util$AgdaMode.Assert.equal(undefined, "λ", instance.editors.source.getText());
                                      return Promise.resolve(/* () */0);
                                    }));
                      }));
                return Promise$BsMocha.it("should deactivate after typing \"ENTER\" (\"Gl\" + \"ENTER\")")(undefined, undefined, undefined, (function (param) {
                              return Test__Util$AgdaMode.openAndLoad("Temp.agda").then((function (param) {
                                                    return Test__Util$AgdaMode.Keyboard.dispatch("\\", param);
                                                  })).then((function (param) {
                                                  return Test__Util$AgdaMode.Keyboard.insert("G", param);
                                                })).then((function (param) {
                                                return Test__Util$AgdaMode.Keyboard.insert("l", param);
                                              })).then((function (param) {
                                              return Test__Util$AgdaMode.Keyboard.insert("\n", param);
                                            })).then((function (instance) {
                                            Test__Util$AgdaMode.Assert.equal(undefined, "λ\n", instance.editors.source.getText());
                                            return Promise.resolve(/* () */0);
                                          }));
                            }));
              }));
        return Mocha$BsMocha.describe("Extension (Issue #72)")(undefined, undefined, undefined, (function (param) {
                      Promise$BsMocha.before(undefined)(undefined, undefined, undefined, (function (param) {
                              Extension$AgdaMode.setConfig(Extension$AgdaMode.defaultKeymap(/* () */0));
                              return Promise.resolve(/* () */0);
                            }));
                      Promise$BsMocha.after_each(undefined)(undefined, undefined, undefined, Test__Util$AgdaMode.Package.after_each);
                      Promise$BsMocha.it("should respect the default keymap extension")(undefined, undefined, undefined, (function (param) {
                              var reality = Curry._1(Extension$AgdaMode.readKeymap, /* () */0);
                              var expectation = { };
                              expectation["^r"] = ["ʳ"];
                              expectation["^l"] = ["ˡ"];
                              Test__Util$AgdaMode.Assert.equal(undefined, Caml_obj.caml_equal(reality, expectation), true);
                              return Promise.resolve(/* () */0);
                            }));
                      Promise$BsMocha.it("should make \"ʳ\" the first candidate")(undefined, undefined, undefined, (function (param) {
                              Test__Util$AgdaMode.Assert.equal(undefined, "ʳ", Rebase.$$Array.get(Translator$AgdaMode.translate("^r").candidateSymbols, 0));
                              return Promise.resolve(/* () */0);
                            }));
                      return Promise$BsMocha.it("should make \"ˡ\" the first candidate")(undefined, undefined, undefined, (function (param) {
                                    Test__Util$AgdaMode.Assert.equal(undefined, "ˡ", Rebase.$$Array.get(Translator$AgdaMode.translate("^l").candidateSymbols, 0));
                                    return Promise.resolve(/* () */0);
                                  }));
                    }));
      }));

/*  Not a pure module */