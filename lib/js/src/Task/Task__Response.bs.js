// Generated by BUCKLESCRIPT, PLEASE EDIT WITH CARE
'use strict';

var Curry = require("bs-platform/lib/js/curry.js");
var Rebase = require("@glennsl/rebase/lib/js/src/Rebase.bs.js");
var $$Promise = require("reason-promise/lib/js/src/js/promise.js");
var Pervasives = require("bs-platform/lib/js/pervasives.js");
var Goal$AgdaMode = require("../Goal.bs.js");
var Task$AgdaMode = require("./Task.bs.js");
var Parser$AgdaMode = require("../Parser.bs.js");
var Caml_chrome_debugger = require("bs-platform/lib/js/caml_chrome_debugger.js");
var RunningInfo$AgdaMode = require("../RunningInfo.bs.js");
var Instance__Goals$AgdaMode = require("../Instance/Instance__Goals.bs.js");
var Task__DisplayInfo$AgdaMode = require("./Task__DisplayInfo.bs.js");
var Instance__TextEditors$AgdaMode = require("../Instance/Instance__TextEditors.bs.js");
var Instance__Highlightings$AgdaMode = require("../Instance/Instance__Highlightings.bs.js");

function handle(response) {
  if (typeof response === "number") {
    switch (response) {
      case /* NoStatus */0 :
      case /* ClearRunningInfo */1 :
          return /* [] */0;
      case /* ClearHighlighting */2 :
          return /* :: */Caml_chrome_debugger.simpleVariant("::", [
                    /* WithInstance */Caml_chrome_debugger.variant("WithInstance", 0, [(function (instance) {
                            Instance__Highlightings$AgdaMode.destroyAll(instance);
                            return Task$AgdaMode.$$return(/* [] */0);
                          })]),
                    /* [] */0
                  ]);
      case /* DoneAborting */3 :
          return /* :: */Caml_chrome_debugger.simpleVariant("::", [
                    /* Display */Caml_chrome_debugger.variant("Display", 2, [
                        "Status",
                        /* Warning */4,
                        /* Emacs */Caml_chrome_debugger.simpleVariant("Emacs", [/* PlainText */Caml_chrome_debugger.variant("PlainText", 8, ["Done aborting"])])
                      ]),
                    /* [] */0
                  ]);
      
    }
  } else {
    switch (response.tag | 0) {
      case /* HighlightingInfoDirect */0 :
          return /* :: */Caml_chrome_debugger.simpleVariant("::", [
                    /* Highlightings */Caml_chrome_debugger.variant("Highlightings", 6, [/* AddDirectly */Caml_chrome_debugger.variant("AddDirectly", 0, [response[1]])]),
                    /* [] */0
                  ]);
      case /* HighlightingInfoIndirect */1 :
          return /* :: */Caml_chrome_debugger.simpleVariant("::", [
                    /* Highlightings */Caml_chrome_debugger.variant("Highlightings", 6, [/* AddIndirectly */Caml_chrome_debugger.variant("AddIndirectly", 1, [response[0]])]),
                    /* [] */0
                  ]);
      case /* Status */2 :
          var checked = response[1];
          var displayImplicit = response[0];
          if (displayImplicit || checked) {
            return /* :: */Caml_chrome_debugger.simpleVariant("::", [
                      /* Display */Caml_chrome_debugger.variant("Display", 2, [
                          "Status",
                          /* PlainText */0,
                          /* Emacs */Caml_chrome_debugger.simpleVariant("Emacs", [/* PlainText */Caml_chrome_debugger.variant("PlainText", 8, ["Typechecked: " + (Pervasives.string_of_bool(checked) + ("\nDisplay implicit arguments: " + Pervasives.string_of_bool(displayImplicit)))])])
                        ]),
                      /* [] */0
                    ]);
          } else {
            return /* [] */0;
          }
      case /* JumpToError */3 :
          var index = response[1];
          var targetFilePath = response[0];
          return /* :: */Caml_chrome_debugger.simpleVariant("::", [
                    /* WithInstance */Caml_chrome_debugger.variant("WithInstance", 0, [(function (instance) {
                            if (targetFilePath === Instance__TextEditors$AgdaMode.getPath(instance)) {
                              var point = instance.editors.source.getBuffer().positionForCharacterIndex(index - 1 | 0);
                              return $$Promise.map($$Promise.exec((function (resolve) {
                                                setTimeout((function (param) {
                                                        instance.editors.source.setCursorBufferPosition(point);
                                                        Curry._1(resolve, /* () */0);
                                                        return /* () */0;
                                                      }), 0);
                                                return /* () */0;
                                              })), (function (param) {
                                            return /* Ok */Caml_chrome_debugger.variant("Ok", 0, [/* [] */0]);
                                          }));
                            } else {
                              return Task$AgdaMode.$$return(/* [] */0);
                            }
                          })]),
                    /* [] */0
                  ]);
      case /* InteractionPoints */4 :
          var indices = response[0];
          return /* :: */Caml_chrome_debugger.simpleVariant("::", [
                    /* WithInstance */Caml_chrome_debugger.variant("WithInstance", 0, [(function (instance) {
                            Instance__Goals$AgdaMode.instantiateAll(indices, instance);
                            return Task$AgdaMode.$$return(/* [] */0);
                          })]),
                    /* [] */0
                  ]);
      case /* GiveAction */5 :
          var give = response[1];
          var index$1 = response[0];
          return /* :: */Caml_chrome_debugger.simpleVariant("::", [
                    /* WithInstance */Caml_chrome_debugger.variant("WithInstance", 0, [(function (instance) {
                            var match = Instance__Goals$AgdaMode.find(index$1, instance);
                            if (match !== undefined) {
                              var goal = match;
                              if (typeof give === "number") {
                                if (give === 0) {
                                  var content = Goal$AgdaMode.getContent(goal);
                                  Goal$AgdaMode.setContent("(" + (content + ")"), goal);
                                }
                                
                              } else {
                                Goal$AgdaMode.setContent(give[0].replace(/\\n/g, "\n"), goal);
                              }
                              Goal$AgdaMode.removeBoundary(goal);
                              Goal$AgdaMode.destroy(goal);
                              return Task$AgdaMode.$$return(/* [] */0);
                            } else {
                              console.log("error: cannot find goal #" + String(index$1));
                              return Task$AgdaMode.$$return(/* [] */0);
                            }
                          })]),
                    /* [] */0
                  ]);
      case /* MakeCase */6 :
          var lines = response[1];
          var makeCaseType = response[0];
          return /* :: */Caml_chrome_debugger.simpleVariant("::", [
                    /* WithInstance */Caml_chrome_debugger.variant("WithInstance", 0, [(function (instance) {
                            var pointed = Instance__TextEditors$AgdaMode.pointingAt(undefined, instance);
                            if (pointed !== undefined) {
                              var goal = pointed;
                              if (makeCaseType) {
                                Goal$AgdaMode.writeLambda(lines, goal);
                              } else {
                                Goal$AgdaMode.writeLines(lines, goal);
                              }
                              return Task$AgdaMode.$$return(/* :: */Caml_chrome_debugger.simpleVariant("::", [
                                            /* DispatchCommand */Caml_chrome_debugger.variant("DispatchCommand", 7, [/* Load */0]),
                                            /* [] */0
                                          ]));
                            } else {
                              return $$Promise.resolved(/* Error */Caml_chrome_debugger.variant("Error", 1, [/* OutOfGoal */1]));
                            }
                          })]),
                    /* [] */0
                  ]);
      case /* SolveAll */7 :
          var solutions = response[0];
          return /* :: */Caml_chrome_debugger.simpleVariant("::", [
                    /* WithInstance */Caml_chrome_debugger.variant("WithInstance", 0, [(function (instance) {
                            var solve = function (param) {
                              var match = Instance__Goals$AgdaMode.find(param[0], instance);
                              if (match !== undefined) {
                                var goal = match;
                                Goal$AgdaMode.setContent(param[1], goal);
                                Instance__Goals$AgdaMode.setCursor(goal, instance);
                                return /* :: */Caml_chrome_debugger.simpleVariant("::", [
                                          /* DispatchCommand */Caml_chrome_debugger.variant("DispatchCommand", 7, [/* Give */13]),
                                          /* [] */0
                                        ]);
                              } else {
                                return /* [] */0;
                              }
                            };
                            var tasks = Rebase.List.flatMap(solve, Rebase.List.fromArray(solutions));
                            var size = Rebase.$$Array.length(solutions);
                            var after = size === 0 ? /* :: */Caml_chrome_debugger.simpleVariant("::", [
                                  /* Display */Caml_chrome_debugger.variant("Display", 2, [
                                      "No solutions found",
                                      /* PlainText */0,
                                      /* Emacs */Caml_chrome_debugger.simpleVariant("Emacs", [/* PlainText */Caml_chrome_debugger.variant("PlainText", 8, [""])])
                                    ]),
                                  /* [] */0
                                ]) : /* :: */Caml_chrome_debugger.simpleVariant("::", [
                                  /* Display */Caml_chrome_debugger.variant("Display", 2, [
                                      String(size) + " goals solved",
                                      /* Success */3,
                                      /* Emacs */Caml_chrome_debugger.simpleVariant("Emacs", [/* PlainText */Caml_chrome_debugger.variant("PlainText", 8, [""])])
                                    ]),
                                  /* [] */0
                                ]);
                            return Task$AgdaMode.$$return(Rebase.List.concat(tasks, after));
                          })]),
                    /* [] */0
                  ]);
      case /* DisplayInfo */8 :
          return Task__DisplayInfo$AgdaMode.handle(response[0]);
      case /* RunningInfo */9 :
          var message = response[1];
          if (response[0] >= 2) {
            return /* :: */Caml_chrome_debugger.simpleVariant("::", [
                      /* WithInstance */Caml_chrome_debugger.variant("WithInstance", 0, [(function (instance) {
                              RunningInfo$AgdaMode.add(Parser$AgdaMode.agdaOutput(message), instance.runningInfo);
                              return Task$AgdaMode.$$return(/* [] */0);
                            })]),
                      /* [] */0
                    ]);
          } else {
            return /* :: */Caml_chrome_debugger.simpleVariant("::", [
                      /* Display */Caml_chrome_debugger.variant("Display", 2, [
                          "Type-checking",
                          /* PlainText */0,
                          /* Emacs */Caml_chrome_debugger.simpleVariant("Emacs", [/* PlainText */Caml_chrome_debugger.variant("PlainText", 8, [message])])
                        ]),
                      /* [] */0
                    ]);
          }
      
    }
  }
}

var Goals = /* alias */0;

var Highlightings = /* alias */0;

var Connections = /* alias */0;

var TextEditors = /* alias */0;

exports.Goals = Goals;
exports.Highlightings = Highlightings;
exports.Connections = Connections;
exports.TextEditors = TextEditors;
exports.handle = handle;
/* Promise Not a pure module */
