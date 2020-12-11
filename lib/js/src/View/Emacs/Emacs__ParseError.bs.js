// Generated by BUCKLESCRIPT, PLEASE EDIT WITH CARE
'use strict';

var React = require("react");
var Connection$AgdaMode = require("../../Connection.bs.js");

function Emacs__ParseError(Props) {
  var connection = Props.connection;
  return React.createElement("section", undefined, React.createElement("p", undefined, "Something went terribly wrong when trying to parse some responses from Agda"), React.createElement("p", {
                  className: "text-warning"
                }, "Please press the button down here, copy the generated log and paste it ", React.createElement("a", {
                      href: "https://github.com/banacorn/agda-mode/issues/new"
                    }, "here")), React.createElement("p", undefined, React.createElement("button", {
                      className: "btn btn-primary icon icon-clippy",
                      onClick: (function (param) {
                          return Connection$AgdaMode.dump(connection);
                        })
                    }, "Dump log")));
}

var make = Emacs__ParseError;

exports.make = make;
/* react Not a pure module */