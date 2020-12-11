// Generated by BUCKLESCRIPT, PLEASE EDIT WITH CARE
'use strict';

var Curry = require("bs-platform/lib/js/curry.js");
var React = require("react");
var Belt_Array = require("bs-platform/lib/js/belt_Array.js");
var Belt_Option = require("bs-platform/lib/js/belt_Option.js");
var Util$AgdaMode = require("../../Util/Util.bs.js");
var Parser$AgdaMode = require("../../Parser.bs.js");
var Caml_splice_call = require("bs-platform/lib/js/caml_splice_call.js");
var Caml_chrome_debugger = require("bs-platform/lib/js/caml_chrome_debugger.js");
var Type__Location$AgdaMode = require("../../Type/Type__Location.bs.js");
var Component__Link$AgdaMode = require("../Component__Link.bs.js");
var Component__Range$AgdaMode = require("../Component__Range.bs.js");

function toString(param) {
  switch (param.tag | 0) {
    case /* Plain */0 :
        return param[0];
    case /* QuestionMark */1 :
        return "?" + String(param[0]);
    case /* Underscore */2 :
        return "_" + param[0];
    
  }
}

function Emacs__Component$Term(Props) {
  var term = Props.term;
  switch (term.tag | 0) {
    case /* Plain */0 :
        return React.createElement("span", {
                    className: "expr"
                  }, term[0]);
    case /* QuestionMark */1 :
        var i = term[0];
        return React.createElement(Component__Link$AgdaMode.make, {
                    target: /* HoleLink */Caml_chrome_debugger.variant("HoleLink", 1, [i]),
                    jump: true,
                    hover: true,
                    className: /* :: */Caml_chrome_debugger.simpleVariant("::", [
                        "expr",
                        /* :: */Caml_chrome_debugger.simpleVariant("::", [
                            "question-mark",
                            /* [] */0
                          ])
                      ]),
                    children: "?" + String(i)
                  });
    case /* Underscore */2 :
        return React.createElement("span", {
                    className: "expr underscore"
                  }, term[0]);
    
  }
}

var Term = {
  toString: toString,
  jump: true,
  hover: true,
  make: Emacs__Component$Term
};

function toString$1(xs) {
  return Caml_splice_call.spliceObjApply(" ", "concat", [Belt_Array.map(xs, toString)]);
}

function parse(raw) {
  var __x = raw.trim();
  return Belt_Array.keepMap(Belt_Array.mapWithIndex(__x.split(/(\?\d+)|(\_\d+[^\}\)\s]*)/), (function (i, token) {
                    var match = i % 3;
                    if (match !== 1) {
                      if (match !== 2) {
                        return Belt_Option.map(token, (function (x) {
                                      return /* Plain */Caml_chrome_debugger.variant("Plain", 0, [x]);
                                    }));
                      } else {
                        return Belt_Option.map(token, (function (x) {
                                      return /* Underscore */Caml_chrome_debugger.variant("Underscore", 2, [x]);
                                    }));
                      }
                    } else {
                      return Belt_Option.map(Belt_Option.flatMap(Belt_Option.map(token, (function (param) {
                                            return param.slice(1);
                                          })), Parser$AgdaMode.$$int), (function (x) {
                                    return /* QuestionMark */Caml_chrome_debugger.variant("QuestionMark", 1, [x]);
                                  }));
                    }
                  })), (function (x) {
                return x;
              }));
}

function Emacs__Component$Expr(Props) {
  var expr = Props.expr;
  return React.createElement("span", undefined, Belt_Array.mapWithIndex(expr, (function (i, term) {
                    return React.createElement(Emacs__Component$Term, {
                                term: term,
                                key: String(i)
                              });
                  })));
}

var Expr = {
  toString: toString$1,
  parse: parse,
  make: Emacs__Component$Expr
};

function toString$2(param) {
  if (param.tag) {
    return toString$1(param[0]);
  } else {
    return toString$1(param[0]) + (" : " + toString$1(param[1]));
  }
}

var partial_arg = /^([^\:]*) \: ((?:\n|.)+)/;

function parseOfType(param) {
  return Parser$AgdaMode.captures((function (captured) {
                return Belt_Option.flatMap(Parser$AgdaMode.at(captured, 2, parse), (function (type_) {
                              return Belt_Option.flatMap(Parser$AgdaMode.at(captured, 1, parse), (function (term) {
                                            return /* OfType */Caml_chrome_debugger.variant("OfType", 0, [
                                                      term,
                                                      type_
                                                    ]);
                                          }));
                            }));
              }), partial_arg, param);
}

var partial_arg$1 = /^Type ((?:\n|.)+)/;

function parseJustType(param) {
  return Parser$AgdaMode.captures((function (captured) {
                return Belt_Option.map(Parser$AgdaMode.at(captured, 1, parse), (function (type_) {
                              return /* JustType */Caml_chrome_debugger.variant("JustType", 1, [type_]);
                            }));
              }), partial_arg$1, param);
}

var partial_arg$2 = /^Sort ((?:\n|.)+)/;

function parseJustSort(param) {
  return Parser$AgdaMode.captures((function (captured) {
                return Belt_Option.map(Parser$AgdaMode.at(captured, 1, parse), (function (sort) {
                              return /* JustSort */Caml_chrome_debugger.variant("JustSort", 2, [sort]);
                            }));
              }), partial_arg$2, param);
}

function parseOthers(raw) {
  return Belt_Option.map(parse(raw), (function (raw$prime) {
                return /* Others */Caml_chrome_debugger.variant("Others", 3, [raw$prime]);
              }));
}

var partial_arg$3 = [
  parseOfType,
  parseJustType,
  parseJustSort,
  parseOthers
];

function parse$1(param) {
  return Parser$AgdaMode.choice(partial_arg$3, param);
}

function Emacs__Component$OutputConstraint(Props) {
  var value = Props.value;
  var range = Props.range;
  var range$1 = Belt_Option.mapWithDefault(range, null, (function (range) {
          return React.createElement(Component__Range$AgdaMode.make, {
                      range: range,
                      abbr: true
                    });
        }));
  switch (value.tag | 0) {
    case /* OfType */0 :
        return React.createElement("li", {
                    className: "output"
                  }, React.createElement(Emacs__Component$Expr, {
                        expr: value[0]
                      }), " : ", React.createElement(Emacs__Component$Expr, {
                        expr: value[1]
                      }), range$1);
    case /* JustType */1 :
        return React.createElement("li", {
                    className: "output"
                  }, "Type ", React.createElement(Emacs__Component$Expr, {
                        expr: value[0]
                      }), range$1);
    case /* JustSort */2 :
        return React.createElement("li", {
                    className: "output"
                  }, "Sort ", React.createElement(Emacs__Component$Expr, {
                        expr: value[0]
                      }), range$1);
    case /* Others */3 :
        return React.createElement("li", {
                    className: "output"
                  }, React.createElement(Emacs__Component$Expr, {
                        expr: value[0]
                      }), range$1);
    
  }
}

var OutputConstraint = {
  toString: toString$2,
  parseOfType: parseOfType,
  parseJustType: parseJustType,
  parseJustSort: parseJustSort,
  parseOthers: parseOthers,
  parse: parse$1,
  make: Emacs__Component$OutputConstraint
};

function Emacs__Component$Labeled(Props) {
  var label = Props.label;
  var expr = Props.expr;
  return React.createElement("li", {
              className: "labeled"
            }, React.createElement("span", {
                  className: "label"
                }, label), React.createElement(Emacs__Component$Expr, {
                  expr: expr
                }));
}

var Labeled = {
  make: Emacs__Component$Labeled
};

function toString$3(param) {
  var match = param[1];
  var c = param[0];
  if (match !== undefined) {
    return "Output " + (toString$2(c) + (" " + Type__Location$AgdaMode.$$Range.toString(match)));
  } else {
    return "Output " + toString$2(c);
  }
}

function parseOutputWithoutRange(raw) {
  return Belt_Option.map(Curry._1(parse$1, raw), (function (x) {
                return /* Output */Caml_chrome_debugger.simpleVariant("Output", [
                          x,
                          undefined
                        ]);
              }));
}

var partial_arg$4 = /((?:\n|.)*\S+)\s*\[ at ([^\]]+) \]/;

function parseOutputWithRange(param) {
  return Parser$AgdaMode.captures((function (captured) {
                return Belt_Option.map(Belt_Option.flatMap(Belt_Option.flatMap(Belt_Array.get(captured, 1), (function (x) {
                                      return x;
                                    })), parse$1), (function (oc) {
                              var r = Belt_Option.flatMap(Belt_Option.flatMap(Belt_Array.get(captured, 2), (function (x) {
                                          return x;
                                        })), Type__Location$AgdaMode.$$Range.parse);
                              return /* Output */Caml_chrome_debugger.simpleVariant("Output", [
                                        oc,
                                        r
                                      ]);
                            }));
              }), partial_arg$4, param);
}

function parse$2(raw) {
  var rangeRe = /\[ at (\S+\:(?:\d+\,\d+\-\d+\,\d+|\d+\,\d+\-\d+)) \]$/;
  var hasRange = rangeRe.test(raw);
  if (hasRange) {
    return Curry._1(parseOutputWithRange, raw);
  } else {
    return parseOutputWithoutRange(raw);
  }
}

function Emacs__Component$Output(Props) {
  var value = Props.value;
  return React.createElement(Emacs__Component$OutputConstraint, {
              value: value[0],
              range: value[1]
            });
}

var Output = {
  toString: toString$3,
  parseOutputWithoutRange: parseOutputWithoutRange,
  parseOutputWithRange: parseOutputWithRange,
  parse: parse$2,
  make: Emacs__Component$Output
};

function toString$4(param) {
  if (param.tag) {
    return Type__Location$AgdaMode.$$Range.toString(param[0]);
  } else {
    return param[0];
  }
}

function parse$3(raw) {
  return Belt_Array.mapWithIndex(Belt_Array.keepMap(raw.split(/([^\(\)\s]+\:(?:\d+\,\d+\-\d+\,\d+|\d+\,\d+\-\d+))/), (function (x) {
                    return x;
                  })), (function (i, token) {
                var match = i % 2;
                if (match !== 1) {
                  return /* Text */Caml_chrome_debugger.variant("Text", 0, [token]);
                } else {
                  return Belt_Option.mapWithDefault(Curry._1(Type__Location$AgdaMode.$$Range.parse, token), /* Text */Caml_chrome_debugger.variant("Text", 0, [token]), (function (x) {
                                return /* Range */Caml_chrome_debugger.variant("Range", 1, [x]);
                              }));
                }
              }));
}

function Emacs__Component$PlainText(Props) {
  var value = Props.value;
  return React.createElement("span", undefined, Belt_Array.mapWithIndex(value, (function (i, param) {
                    if (param.tag) {
                      return React.createElement(Component__Range$AgdaMode.make, {
                                  range: param[0],
                                  key: String(i)
                                });
                    } else {
                      return param[0];
                    }
                  })));
}

var PlainText = {
  toString: toString$4,
  parse: parse$3,
  make: Emacs__Component$PlainText
};

function toString$5(param) {
  return Util$AgdaMode.Pretty.array(Belt_Array.map(param[0], toString$4));
}

function parse$4(isWarning, raw) {
  return Belt_Option.map(parse$3(raw), (function (body) {
                if (isWarning) {
                  return /* WarningMessage */Caml_chrome_debugger.variant("WarningMessage", 0, [body]);
                } else {
                  return /* ErrorMessage */Caml_chrome_debugger.variant("ErrorMessage", 1, [body]);
                }
              }));
}

function parseWarning(param) {
  return parse$4(true, param);
}

function parseError(param) {
  return parse$4(false, param);
}

function Emacs__Component$WarningError(Props) {
  var value = Props.value;
  if (value.tag) {
    return React.createElement("li", {
                className: "warning-error"
              }, React.createElement("span", {
                    className: "error-label"
                  }, "error"), React.createElement(Emacs__Component$PlainText, {
                    value: value[0]
                  }));
  } else {
    return React.createElement("li", {
                className: "warning-error"
              }, React.createElement("span", {
                    className: "warning-label"
                  }, "warning"), React.createElement(Emacs__Component$PlainText, {
                    value: value[0]
                  }));
  }
}

var WarningError = {
  toString: toString$5,
  parse: parse$4,
  parseWarning: parseWarning,
  parseError: parseError,
  make: Emacs__Component$WarningError
};

exports.Term = Term;
exports.Expr = Expr;
exports.OutputConstraint = OutputConstraint;
exports.Labeled = Labeled;
exports.Output = Output;
exports.PlainText = PlainText;
exports.WarningError = WarningError;
/* react Not a pure module */