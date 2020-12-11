// Generated by BUCKLESCRIPT, PLEASE EDIT WITH CARE
'use strict';

var Curry = require("bs-platform/lib/js/curry.js");
var Rebase = require("@glennsl/rebase/lib/js/src/Rebase.bs.js");
var Mocha$BsMocha = require("bs-mocha/lib/js/src/Mocha.bs.js");
var Promise$BsMocha = require("bs-mocha/lib/js/src/Promise.bs.js");
var Test__Util$AgdaMode = require("./Test__Util.bs.js");
var Webapi__Dom__Element = require("bs-webapi/lib/js/src/Webapi/Webapi__Dom/Webapi__Dom__Element.js");

Mocha$BsMocha.describe("View")(undefined, undefined, undefined, (function (param) {
        Mocha$BsMocha.describe("Activation/deactivation")(undefined, undefined, undefined, (function (param) {
                Mocha$BsMocha.describe("when activating agda-mode")(undefined, undefined, undefined, (function (param) {
                        Promise$BsMocha.after_each(undefined)(undefined, undefined, undefined, Test__Util$AgdaMode.Package.after_each);
                        Promise$BsMocha.it("should mount `article.agda-mode-panel-container` at the bottom")(undefined, undefined, undefined, (function (param) {
                                return Test__Util$AgdaMode.openAndLoad("Blank1.agda").then((function (param) {
                                              var children = Rebase.$$Array.filterMap(Webapi__Dom__Element.ofNode, Rebase.$$Array.flatMap(Curry._2(Rebase.Fn.$great$great, Curry._2(Rebase.Fn.$great$great, (function (prim) {
                                                                  return atom.views.getView(prim);
                                                                }), (function (prim) {
                                                                  return prim.childNodes;
                                                                })), (function (prim) {
                                                              return Array.prototype.slice.call(prim);
                                                            })), atom.workspace.getBottomPanels()));
                                              Test__Util$AgdaMode.Assert.yes(Rebase.$$Array.map((function (prim) {
                                                            return prim.className;
                                                          }), children).includes("agda-mode-panel-container"));
                                              return Promise.resolve(/* () */0);
                                            }));
                              }));
                        return Promise$BsMocha.it("should mount `section#agda-mode:xxx` inside `article.agda-mode-panel-container`")(undefined, undefined, undefined, (function (param) {
                                      var partial_arg = Curry._2(Rebase.Fn.$great$great, Test__Util$AgdaMode.Assert.ok, (function (prim) {
                                              return Promise.resolve(prim);
                                            }));
                                      return Test__Util$AgdaMode.openAndLoad("Blank1.agda").then(Test__Util$AgdaMode.View.getPanel).then(Curry.__1(partial_arg));
                                    }));
                      }));
                return Mocha$BsMocha.describe("when closing the editor")(undefined, undefined, undefined, (function (param) {
                              Promise$BsMocha.after_each(undefined)(undefined, undefined, undefined, Test__Util$AgdaMode.Package.after_each);
                              Promise$BsMocha.it("should unmount `section#agda-mode:xxx` from `article.agda-mode-panel-container` when docker at bottom")(undefined, undefined, undefined, (function (param) {
                                      return Test__Util$AgdaMode.openAndLoad("Temp.agda").then(Test__Util$AgdaMode.close).then((function (param) {
                                                    Test__Util$AgdaMode.Assert.equal(undefined, 0, Rebase.$$Array.length(Rebase.$$Array.flatMap(Test__Util$AgdaMode.View.childHtmlElements, Test__Util$AgdaMode.View.getPanelContainers(/* () */0))));
                                                    return Promise.resolve(/* () */0);
                                                  }));
                                    }));
                              return Promise$BsMocha.it_skip("should close the tab when docked at pane")(undefined, undefined, undefined, (function (param) {
                                            return Test__Util$AgdaMode.openAndLoad("Temp.agda").then((function (param) {
                                                              return Test__Util$AgdaMode.dispatch("agda-mode:toggle-docking", param);
                                                            })).then(Test__Util$AgdaMode.close).then((function (param) {
                                                          Test__Util$AgdaMode.Assert.equal(undefined, 0, Rebase.$$Array.length(Rebase.$$Array.flatMap(Test__Util$AgdaMode.View.childHtmlElements, Test__Util$AgdaMode.View.getPanelContainers(/* () */0))));
                                                          return Promise.resolve(/* () */0);
                                                        }));
                                          }));
                            }));
              }));
        return Mocha$BsMocha.describe("Docking")(undefined, undefined, undefined, (function (param) {
                      Mocha$BsMocha.describe("when toggle docking")(undefined, undefined, undefined, (function (param) {
                              Promise$BsMocha.after_each(undefined)(undefined, undefined, undefined, Test__Util$AgdaMode.Package.after_each);
                              return Promise$BsMocha.it("should open a new tab")(undefined, undefined, undefined, (function (param) {
                                            return Test__Util$AgdaMode.openAndLoad("Blank1.agda").then((function (param) {
                                                            return Test__Util$AgdaMode.dispatch("agda-mode:toggle-docking", param);
                                                          })).then((function (param) {
                                                          Test__Util$AgdaMode.Assert.yes(Rebase.$$Array.map((function (prim) {
                                                                        return prim.className;
                                                                      }), Test__Util$AgdaMode.View.getPanelContainersAtPanes(/* () */0)).includes("agda-mode-panel-container"));
                                                          return Promise.resolve(/* () */0);
                                                        }));
                                          }));
                            }));
                      return Mocha$BsMocha.describe("when toggle docking again")(undefined, undefined, undefined, (function (param) {
                                    Promise$BsMocha.after_each(undefined)(undefined, undefined, undefined, Test__Util$AgdaMode.Package.after_each);
                                    Promise$BsMocha.it("should close the opened tab")(undefined, undefined, undefined, (function (param) {
                                            return Test__Util$AgdaMode.openAndLoad("Blank1.agda").then((function (param) {
                                                              return Test__Util$AgdaMode.dispatch("agda-mode:toggle-docking", param);
                                                            })).then((function (param) {
                                                            return Test__Util$AgdaMode.dispatch("agda-mode:toggle-docking", param);
                                                          })).then((function (param) {
                                                          Test__Util$AgdaMode.Assert.no(Rebase.$$Array.map((function (prim) {
                                                                        return prim.className;
                                                                      }), Test__Util$AgdaMode.View.getPanelContainersAtPanes(/* () */0)).includes("agda-mode-panel-container"));
                                                          return Promise.resolve(/* () */0);
                                                        }));
                                          }));
                                    return Promise$BsMocha.it("should dock the panel back to the existing bottom panel container")(undefined, undefined, undefined, (function (param) {
                                                  return Test__Util$AgdaMode.openAndLoad("Blank1.agda").then((function (param) {
                                                                    return Test__Util$AgdaMode.dispatch("agda-mode:toggle-docking", param);
                                                                  })).then((function (param) {
                                                                  return Test__Util$AgdaMode.dispatch("agda-mode:toggle-docking", param);
                                                                })).then((function (param) {
                                                                Test__Util$AgdaMode.Assert.equal(undefined, 1, Rebase.$$Array.length(Test__Util$AgdaMode.View.getPanelContainersAtBottom(/* () */0)));
                                                                return Promise.resolve(/* () */0);
                                                              }));
                                                }));
                                  }));
                    }));
      }));

/*  Not a pure module */