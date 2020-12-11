// Generated by BUCKLESCRIPT, PLEASE EDIT WITH CARE
'use strict';

var Curry = require("bs-platform/lib/js/curry.js");
var Rebase = require("@glennsl/rebase/lib/js/src/Rebase.bs.js");
var Caml_option = require("bs-platform/lib/js/caml_option.js");
var Util$AgdaMode = require("../../Util/Util.bs.js");
var Type__Location$AgdaMode = require("../../Type/Type__Location.bs.js");
var Emacs__Component$AgdaMode = require("./Emacs__Component.bs.js");

function unindent(lines) {
  var newLineIndices = Rebase.$$Array.map((function (param) {
          return param[2];
        }), Rebase.$$Array.filter((function (param) {
              var line = param[0];
              var nextLine = param[1];
              var sort = /^Sort \S*/;
              var delimeter = /^\u2014{4}/g;
              var completeJudgement = /^(?:(?:[^\(\{\s]+\s+\:=?)|Have\:|Goal\:)\s* \S*/;
              var reallyLongTermIdentifier = /^\S+$/;
              var restOfTheJudgement = /^\s*\:=?\s* \S*/;
              if (sort.test(line) || delimeter.test(line) || reallyLongTermIdentifier.test(line) && Rebase.$$Option.exists((function (line) {
                        return restOfTheJudgement.test(line);
                      }), nextLine)) {
                return true;
              } else {
                return completeJudgement.test(line);
              }
            }), Rebase.$$Array.mapi((function (line, index) {
                  return /* tuple */[
                          line,
                          Rebase.$$Array.get(lines, index + 1 | 0),
                          index
                        ];
                }), lines)));
  return Rebase.$$Array.map((function (param) {
                return Rebase.$$String.joinWith("\n", Rebase.List.fromArray(Rebase.$$Array.slice(param[0], param[1], lines)));
              }), Rebase.$$Array.mapi((function (index, i) {
                    var match = Rebase.$$Array.get(newLineIndices, i + 1 | 0);
                    if (match !== undefined) {
                      return /* tuple */[
                              index,
                              match
                            ];
                    } else {
                      return /* tuple */[
                              index,
                              Rebase.$$Array.length(lines) + 1 | 0
                            ];
                    }
                  }), newLineIndices));
}

function partiteMetas(param) {
  return Util$AgdaMode.Dict.split("metas", (function (rawMetas) {
                var metas = unindent(rawMetas);
                var indexOfHiddenMetas = Rebase.$$Option.map((function (prim) {
                        return prim[0];
                      }), Rebase.$$Array.findIndex((function (s) {
                            return Rebase.$$Option.isSome(Curry._1(Emacs__Component$AgdaMode.Output.parseOutputWithRange, s));
                          }), metas));
                return Util$AgdaMode.Dict.partite((function (param) {
                              var i = param[1];
                              if (indexOfHiddenMetas !== undefined) {
                                if (i === indexOfHiddenMetas) {
                                  return "hiddenMetas";
                                } else if (i === 0) {
                                  return "interactionMetas";
                                } else {
                                  return ;
                                }
                              } else if (i === 0) {
                                return "interactionMetas";
                              } else {
                                return ;
                              }
                            }), metas);
              }), param);
}

function partiteWarningsOrErrors(key) {
  return (function (param) {
      return Util$AgdaMode.Dict.update(key, (function (raw) {
                    var partial_arg = /^\u2014{4}/;
                    var hasDelimeter = Rebase.$$Option.isSome(Rebase.$$Option.flatMap((function (param) {
                                return Caml_option.null_to_opt(param.match(partial_arg));
                              }), Rebase.$$Array.get(raw, 0)));
                    var lines = hasDelimeter ? raw.slice(1) : raw;
                    var markWarningStart = function (line) {
                      return Rebase.$$Option.isSome(Curry._1(Type__Location$AgdaMode.$$Range.parse, line));
                    };
                    var glueBack = function (xs) {
                      var partial_arg = /at$/;
                      return Rebase.$$Option.isSome(Rebase.$$Option.flatMap((function (param) {
                                        return Caml_option.null_to_opt(param.match(partial_arg));
                                      }), Rebase.$$Array.get(xs, Rebase.$$Array.length(xs) - 1 | 0)));
                    };
                    return Rebase.$$Array.map((function (xs) {
                                  return Rebase.$$String.joinWith("\n", Rebase.List.fromArray(xs));
                                }), Util$AgdaMode.Array_.mergeWithNext(glueBack, Util$AgdaMode.Array_.partite(markWarningStart, lines)));
                  }), param);
    });
}

exports.unindent = unindent;
exports.partiteMetas = partiteMetas;
exports.partiteWarningsOrErrors = partiteWarningsOrErrors;
/* Util-AgdaMode Not a pure module */