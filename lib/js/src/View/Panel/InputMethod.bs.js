// Generated by BUCKLESCRIPT VERSION 5.0.4, PLEASE EDIT WITH CARE
'use strict';

var Atom = require("atom");
var $$Array = require("bs-platform/lib/js/array.js");
var Block = require("bs-platform/lib/js/block.js");
var Curry = require("bs-platform/lib/js/curry.js");
var React = require("react");
var Rebase = require("@glennsl/rebase/lib/js/src/Rebase.bs.js");
var ReactUpdate = require("reason-react-update/lib/js/src/ReactUpdate.bs.js");
var Hook$AgdaMode = require("../Hook.bs.js");
var Util$AgdaMode = require("../../Util.bs.js");
var Caml_primitive = require("bs-platform/lib/js/caml_primitive.js");
var Event$AgdaMode = require("../../Util/Event.bs.js");
var Buffer$AgdaMode = require("./InputMethod/Buffer.bs.js");
var Editors$AgdaMode = require("../../Editors.bs.js");
var Translator$AgdaMode = require("./Translator.bs.js");
var Type__View$AgdaMode = require("../../Type/Type__View.bs.js");
var CandidateSymbols$AgdaMode = require("./CandidateSymbols.bs.js");

var initialState_001 = /* markers : array */[];

var initialState = /* record */Block.record([
    "activated",
    "markers",
    "buffer"
  ], [
    false,
    initialState_001,
    Buffer$AgdaMode.initial
  ]);

function addClass(editor) {
  atom.views.getView(editor).classList.add("agda-mode-input-method-activated");
  return /* () */0;
}

function removeClass(editor) {
  atom.views.getView(editor).classList.remove("agda-mode-input-method-activated");
  return /* () */0;
}

function getSelections(editor) {
  var getCharIndex = function (selection) {
    var start = selection.getBufferRange().start;
    return editor.getBuffer().characterIndexForPosition(start);
  };
  var compareSelection = function (a, b) {
    return Caml_primitive.caml_int_compare(getCharIndex(a), getCharIndex(b));
  };
  var selections = editor.getSelections();
  $$Array.sort(compareSelection, selections);
  return selections;
}

function insertTextBuffer(editor, $$char) {
  return Rebase.$$Array[/* forEach */8]((function (selection) {
                var range = selection.getBufferRange();
                editor.setTextInBufferRange(range, $$char);
                return /* () */0;
              }), getSelections(editor));
}

function rewriteTextBuffer(editor, markers, string) {
  return Rebase.$$Array[/* forEach */8]((function (marker) {
                editor.getBuffer().setTextInRange(marker.getBufferRange(), string);
                return /* () */0;
              }), markers);
}

function clearAndMarkSelectedAreas(editor) {
  return Rebase.$$Array[/* map */0]((function (selection) {
                var range = selection.getBufferRange();
                editor.setTextInBufferRange(range, "");
                return editor.markBufferRange(range.copy());
              }), getSelections(editor));
}

function markerOnDidChange(editor, send, $$event) {
  var rangeOld = new Atom.Range($$event.oldTailBufferPosition, $$event.oldHeadBufferPosition);
  var rangeNew = new Atom.Range($$event.newTailBufferPosition, $$event.newHeadBufferPosition);
  var oldBuffer = editor.getBuffer().getTextInRange(rangeOld);
  var newBuffer = editor.getBuffer().getTextInRange(rangeNew);
  return Curry._1(send, /* MarkerEvent */Block.variant("MarkerEvent", 1, [
                oldBuffer,
                newBuffer
              ]));
}

function monitor(editor, send) {
  var disposables = new Atom.CompositeDisposable();
  addClass(editor);
  var markers = clearAndMarkSelectedAreas(editor);
  Curry._1(send, /* UpdateMarker */Block.variant("UpdateMarker", 0, [markers]));
  Rebase.$$Option[/* forEach */8]((function (marker) {
          disposables.add(marker.onDidChange((function (param) {
                      return markerOnDidChange(editor, send, param);
                    })));
          disposables.add(atom.commands.add("atom-text-editor.agda-mode-input-method-activated", "editor:newline", (function ($$event) {
                      Curry._1(send, /* Deactivate */1);
                      $$event.stopImmediatePropagation();
                      return /* () */0;
                    })));
          return /* () */0;
        }), Rebase.$$Array[/* get */17](markers, 0));
  disposables.add(editor.onDidChangeCursorPosition((function ($$event) {
              var point = $$event.newBufferPosition;
              var ranges = Rebase.$$Array[/* map */0]((function (prim) {
                      return prim.getBufferRange();
                    }), markers);
              var inRange = Rebase.$$Array[/* exists */9]((function (param) {
                      return param.containsPoint(point);
                    }), ranges);
              if (inRange) {
                return 0;
              } else {
                return Curry._1(send, /* Deactivate */1);
              }
            })));
  var decorations = Rebase.$$Array[/* map */0]((function (marker) {
          return editor.decorateMarker(marker, {
                      type: "highlight",
                      class: "input-method-decoration"
                    });
        }), markers);
  return (function (param) {
            removeClass(editor);
            Rebase.$$Array[/* forEach */8]((function (prim) {
                    prim.destroy();
                    return /* () */0;
                  }), decorations);
            Rebase.$$Array[/* forEach */8]((function (prim) {
                    prim.destroy();
                    return /* () */0;
                  }), markers);
            disposables.dispose();
            return Curry._1(send, /* UpdateMarker */Block.variant("UpdateMarker", 0, [/* array */[]]));
          });
}

function reducer(editor, action, state) {
  if (typeof action === "number") {
    switch (action) {
      case 0 : 
          var match = state[/* activated */0];
          if (match) {
            return /* SideEffects */Block.variant("SideEffects", 2, [(function (param) {
                          var send = param[/* send */0];
                          if (Buffer$AgdaMode.isEmpty(state[/* buffer */2])) {
                            Curry._1(send, /* Insert */Block.variant("Insert", 2, ["\\"]));
                            Curry._1(send, /* Deactivate */1);
                          } else {
                            Curry._1(send, /* Reactivate */2);
                          }
                          return undefined;
                        })]);
          } else {
            return /* Update */Block.variant("Update", 0, [/* record */Block.record([
                          "activated",
                          "markers",
                          "buffer"
                        ], [
                          true,
                          state[/* markers */1],
                          state[/* buffer */2]
                        ])]);
          }
      case 1 : 
          var match$1 = state[/* activated */0];
          if (match$1) {
            return /* Update */Block.variant("Update", 0, [/* record */Block.record([
                          "activated",
                          "markers",
                          "buffer"
                        ], [
                          false,
                          state[/* markers */1],
                          Buffer$AgdaMode.initial
                        ])]);
          } else {
            return /* NoUpdate */0;
          }
      case 2 : 
          var match$2 = state[/* activated */0];
          if (match$2) {
            return /* UpdateWithSideEffects */Block.variant("UpdateWithSideEffects", 1, [
                      /* record */Block.record([
                          "activated",
                          "markers",
                          "buffer"
                        ], [
                          false,
                          state[/* markers */1],
                          Buffer$AgdaMode.initial
                        ]),
                      (function (param) {
                          Curry._1(param[/* send */0], /* Activate */0);
                          return undefined;
                        })
                    ]);
          } else {
            return /* NoUpdate */0;
          }
      
    }
  } else {
    switch (action.tag | 0) {
      case 0 : 
          return /* Update */Block.variant("Update", 0, [/* record */Block.record([
                        "activated",
                        "markers",
                        "buffer"
                      ], [
                        state[/* activated */0],
                        action[0],
                        state[/* buffer */2]
                      ])]);
      case 1 : 
          var match$3 = Buffer$AgdaMode.next(state[/* buffer */2], action[1]);
          if (typeof match$3 === "number") {
            return /* SideEffects */Block.variant("SideEffects", 2, [(function (param) {
                          Curry._1(param[/* send */0], /* Deactivate */1);
                          return undefined;
                        })]);
          } else if (match$3.tag) {
            var buffer = match$3[0];
            return /* UpdateWithSideEffects */Block.variant("UpdateWithSideEffects", 1, [
                      /* record */Block.record([
                          "activated",
                          "markers",
                          "buffer"
                        ], [
                          state[/* activated */0],
                          state[/* markers */1],
                          buffer
                        ]),
                      (function (param) {
                          var surface = Buffer$AgdaMode.toSurface(buffer);
                          Curry._1(param[/* send */0], /* Rewrite */Block.variant("Rewrite", 3, [surface]));
                          return undefined;
                        })
                    ]);
          } else {
            return /* Update */Block.variant("Update", 0, [/* record */Block.record([
                          "activated",
                          "markers",
                          "buffer"
                        ], [
                          state[/* activated */0],
                          state[/* markers */1],
                          match$3[0]
                        ])]);
          }
      case 2 : 
          var $$char = action[0];
          return /* SideEffects */Block.variant("SideEffects", 2, [(function (param) {
                        insertTextBuffer(editor, $$char);
                        return undefined;
                      })]);
      case 3 : 
          var string = action[0];
          return /* SideEffects */Block.variant("SideEffects", 2, [(function (param) {
                        rewriteTextBuffer(editor, state[/* markers */1], string);
                        return undefined;
                      })]);
      
    }
  }
}

function InputMethod(Props) {
  var editors = Props.editors;
  var interceptAndInsertKey = Props.interceptAndInsertKey;
  var activateInputMethod = Props.activateInputMethod;
  var onActivationChange = Props.onActivationChange;
  var isActive = Props.isActive;
  var editor = Editors$AgdaMode.Focus[/* get */0](editors);
  var match = ReactUpdate.useReducer(initialState, (function (param, param$1) {
          return reducer(editor, param, param$1);
        }));
  var send = match[1];
  var state = match[0];
  var debugDispatch = React.useContext(Type__View$AgdaMode.Debug[/* debugDispatch */2]);
  React.useEffect((function () {
          if (atom.inDevMode()) {
            Curry._1(debugDispatch, /* UpdateInputMethod */Block.simpleVariant("UpdateInputMethod", [/* record */Block.record([
                        "activated",
                        "markers",
                        "buffer"
                      ], [
                        state[/* activated */0],
                        state[/* markers */1],
                        state[/* buffer */2]
                      ])]));
          }
          return undefined;
        }), /* array */[state]);
  React.useEffect((function () {
          return Rebase.$$Option[/* some */11](Event$AgdaMode.onOk((function (shouldActivate) {
                              return Curry._1(send, shouldActivate ? /* Activate */0 : /* Deactivate */1);
                            }))(activateInputMethod));
        }), /* array */[]);
  React.useEffect((function () {
          Curry._1(onActivationChange, state[/* activated */0]);
          return undefined;
        }), /* array */[state[/* activated */0]]);
  React.useEffect((function () {
          return Rebase.$$Option[/* some */11](Event$AgdaMode.onOk((function ($$char) {
                              return Curry._1(send, /* Insert */Block.variant("Insert", 2, [$$char]));
                            }))(interceptAndInsertKey));
        }), /* array */[]);
  Hook$AgdaMode.useListenWhen((function (param) {
          return monitor(editor, send);
        }), state[/* activated */0]);
  var translation = Translator$AgdaMode.translate(Buffer$AgdaMode.toSequence(state[/* buffer */2]));
  var className = Curry._1(Util$AgdaMode.ClassName[/* serialize */2], Util$AgdaMode.ClassName[/* addWhen */1]("hidden", !state[/* activated */0], /* :: */Block.simpleVariant("::", [
              "input-method",
              /* [] */0
            ])));
  var bufferClassName = Curry._1(Util$AgdaMode.ClassName[/* serialize */2], Util$AgdaMode.ClassName[/* addWhen */1]("hidden", Buffer$AgdaMode.isEmpty(state[/* buffer */2]), /* :: */Block.simpleVariant("::", [
              "inline-block",
              /* :: */Block.simpleVariant("::", [
                  "buffer",
                  /* [] */0
                ])
            ])));
  return React.createElement("section", {
              className: className
            }, React.createElement("div", {
                  className: "keyboard"
                }, React.createElement("div", {
                      className: bufferClassName
                    }, Buffer$AgdaMode.toSequence(state[/* buffer */2])), Block.spliceApply(React.createElement, [
                      "div",
                      {
                        className: "keys btn-group btn-group-sm"
                      },
                      Rebase.$$Array[/* map */0]((function (key) {
                              return React.createElement("button", {
                                          key: key,
                                          className: "btn",
                                          onClick: (function (param) {
                                              return Curry._1(send, /* Insert */Block.variant("Insert", 2, [key]));
                                            })
                                        }, key);
                            }), translation[/* keySuggestions */2])
                    ])), React.createElement(CandidateSymbols$AgdaMode.make, {
                  isActive: isActive && state[/* activated */0],
                  candidateSymbols: translation[/* candidateSymbols */3],
                  updateTranslation: (function (replace) {
                      if (replace !== undefined) {
                        return Curry._1(send, /* Rewrite */Block.variant("Rewrite", 3, [replace]));
                      } else {
                        return /* () */0;
                      }
                    }),
                  chooseSymbol: (function (symbol) {
                      Curry._1(send, /* Insert */Block.variant("Insert", 2, [symbol]));
                      return Curry._1(send, /* Deactivate */1);
                    })
                }));
}

var sort = $$Array.sort;

var make = InputMethod;

exports.sort = sort;
exports.initialState = initialState;
exports.addClass = addClass;
exports.removeClass = removeClass;
exports.getSelections = getSelections;
exports.insertTextBuffer = insertTextBuffer;
exports.rewriteTextBuffer = rewriteTextBuffer;
exports.clearAndMarkSelectedAreas = clearAndMarkSelectedAreas;
exports.markerOnDidChange = markerOnDidChange;
exports.monitor = monitor;
exports.reducer = reducer;
exports.make = make;
/* atom Not a pure module */