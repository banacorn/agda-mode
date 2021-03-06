// Generated by BUCKLESCRIPT, PLEASE EDIT WITH CARE
'use strict';

var React = require("react");
var Rebase = require("@glennsl/rebase/lib/js/src/Rebase.bs.js");
var Js_dict = require("bs-platform/lib/js/js_dict.js");
var Caml_option = require("bs-platform/lib/js/caml_option.js");
var Util$AgdaMode = require("../../Util/Util.bs.js");
var Emacs__Parser$AgdaMode = require("./Emacs__Parser.bs.js");
var Emacs__Component$AgdaMode = require("./Emacs__Component.bs.js");

function parse(raw) {
  var markGoal = function (param) {
    return Rebase.$$Option.map((function (param) {
                  return "goal";
                }), Caml_option.null_to_opt(param[0].match(/^Goal:/)));
  };
  var markHave = function (param) {
    return Rebase.$$Option.map((function (param) {
                  return "have";
                }), Caml_option.null_to_opt(param[0].match(/^Have:/)));
  };
  var markMetas = function (param) {
    return Rebase.$$Option.map((function (param) {
                  return "metas";
                }), Caml_option.null_to_opt(param[0].match(/\u2014{60}/g)));
  };
  var partiteGoalTypeContext = function (param) {
    return Util$AgdaMode.Dict.partite((function (line) {
                  return Rebase.$$Option.or_(Rebase.$$Option.or_(markGoal(line), markHave(line)), markMetas(line));
                }), param);
  };
  var removeDelimeter = function (param) {
    return Util$AgdaMode.Dict.update("metas", (function (param) {
                  return param.slice(1);
                }), param);
  };
  var lines = raw.split("\n");
  var dictionary = Emacs__Parser$AgdaMode.partiteMetas(removeDelimeter(partiteGoalTypeContext(lines)));
  var goal = Rebase.$$Option.flatMap((function (line) {
          return Emacs__Component$AgdaMode.Expr.parse(Rebase.$$String.joinWith("\n", Rebase.List.fromArray(line)).slice(5));
        }), Js_dict.get(dictionary, "goal"));
  var have = Rebase.$$Option.flatMap((function (line) {
          return Emacs__Component$AgdaMode.Expr.parse(Rebase.$$String.joinWith("\n", Rebase.List.fromArray(line)).slice(5));
        }), Js_dict.get(dictionary, "have"));
  var interactionMetas = Rebase.$$Option.mapOr((function (metas) {
          return Rebase.$$Array.filterMap((function (x) {
                        return x;
                      }), Rebase.$$Array.map(Emacs__Component$AgdaMode.Output.parseOutputWithoutRange, metas));
        }), [], Js_dict.get(dictionary, "interactionMetas"));
  var hiddenMetas = Rebase.$$Option.mapOr((function (metas) {
          return Rebase.$$Array.filterMap((function (x) {
                        return x;
                      }), Rebase.$$Array.map(Emacs__Component$AgdaMode.Output.parseOutputWithRange, metas));
        }), [], Js_dict.get(dictionary, "hiddenMetas"));
  return {
          goal: goal,
          have: have,
          interactionMetas: interactionMetas,
          hiddenMetas: hiddenMetas
        };
}

function Emacs__GoalTypeContext(Props) {
  var body = Props.body;
  var parsed = parse(body);
  return React.createElement(React.Fragment, undefined, React.createElement("ul", undefined, Rebase.$$Option.mapOr((function (expr) {
                        return React.createElement(Emacs__Component$AgdaMode.Labeled.make, {
                                    label: "Goal ",
                                    expr: expr
                                  });
                      }), null, parsed.goal), Rebase.$$Option.mapOr((function (expr) {
                        return React.createElement(Emacs__Component$AgdaMode.Labeled.make, {
                                    label: "Have ",
                                    expr: expr
                                  });
                      }), null, parsed.have)), React.createElement("ul", undefined, Rebase.$$Array.mapi((function (value, i) {
                        return React.createElement(Emacs__Component$AgdaMode.Output.make, {
                                    value: value,
                                    key: String(i)
                                  });
                      }), parsed.interactionMetas)), React.createElement("ul", undefined, Rebase.$$Array.mapi((function (value, i) {
                        return React.createElement(Emacs__Component$AgdaMode.Output.make, {
                                    value: value,
                                    key: String(i)
                                  });
                      }), parsed.hiddenMetas)));
}

var make = Emacs__GoalTypeContext;

exports.parse = parse;
exports.make = make;
/* react Not a pure module */
