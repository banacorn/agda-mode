// Generated by BUCKLESCRIPT VERSION 5.0.4, PLEASE EDIT WITH CARE
'use strict';

var React = require("react");
var Rebase = require("@glennsl/rebase/lib/js/src/Rebase.bs.js");
var Util$AgdaMode = require("../../Util.bs.js");
var Emacs__Parser$AgdaMode = require("./Emacs__Parser.bs.js");
var Emacs__Component$AgdaMode = require("./Emacs__Component.bs.js");

function parse(raw) {
  var lines = raw.split("\n");
  var target = Rebase.$$Option[/* getOr */16]("???", Rebase.$$Option[/* map */0]((function (param) {
              return param.slice(18);
            }), Rebase.$$Array[/* get */17](lines, 0)));
  var outputs = Rebase.$$Array[/* filterMap */23]((function (x) {
          return x;
        }), Rebase.$$Array[/* map */0](Emacs__Component$AgdaMode.Output[/* parse */2], Emacs__Parser$AgdaMode.unindent(Rebase.$$Array[/* map */0]((function (s) {
                      return s.slice(2);
                    }), lines.slice(1)))));
  return /* tuple */[
          target,
          outputs
        ];
}

function Emacs__SearchAbout(Props) {
  var body = Props.body;
  var match = parse(body);
  var outputs = match[1];
  var target = match[0];
  var match$1 = Rebase.$$Array[/* length */16](outputs) === 0;
  if (match$1) {
    return React.createElement("p", undefined, "There are no definitions about " + target);
  } else {
    return React.createElement(React.Fragment, undefined, React.createElement("p", undefined, "Definitions about " + (target + ":")), Util$AgdaMode.React[/* manyIn */0]("ul")(Rebase.$$Array[/* map */0]((function (value) {
                          return React.createElement(Emacs__Component$AgdaMode.Output[/* make */3], {
                                      value: value
                                    });
                        }), outputs)));
  }
}

var make = Emacs__SearchAbout;

exports.parse = parse;
exports.make = make;
/* react Not a pure module */