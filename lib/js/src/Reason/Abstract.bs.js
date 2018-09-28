// Generated by BUCKLESCRIPT VERSION 4.0.5, PLEASE EDIT WITH CARE
'use strict';

var List = require("bs-platform/lib/js/list.js");
var Block = require("bs-platform/lib/js/block.js");
var C$AgdaMode = require("./C.bs.js");
var ReasonReact = require("reason-react/lib/js/src/ReasonReact.js");
var Util$AgdaMode = require("./Util.bs.js");

var component = ReasonReact.statelessComponent("Name");

function make(value, _) {
  return /* record */Block.record([
            "debugName",
            "reactClassInternal",
            "handedOffState",
            "willReceiveProps",
            "didMount",
            "didUpdate",
            "willUnmount",
            "willUpdate",
            "shouldUpdate",
            "render",
            "initialState",
            "retainedProps",
            "reducer",
            "jsElementWrapped"
          ], [
            component[/* debugName */0],
            component[/* reactClassInternal */1],
            component[/* handedOffState */2],
            component[/* willReceiveProps */3],
            component[/* didMount */4],
            component[/* didUpdate */5],
            component[/* willUnmount */6],
            component[/* willUpdate */7],
            component[/* shouldUpdate */8],
            (function () {
                return ReasonReact.element(undefined, undefined, C$AgdaMode.Name[/* make */4](value[/* concrete */1], /* array */[]));
              }),
            component[/* initialState */10],
            component[/* retainedProps */11],
            component[/* reducer */12],
            component[/* jsElementWrapped */13]
          ]);
}

var Name = /* module */Block.localModule([
    "component",
    "make"
  ], [
    component,
    make
  ]);

var component$1 = ReasonReact.statelessComponent("QName");

function make$1(value, _) {
  return /* record */Block.record([
            "debugName",
            "reactClassInternal",
            "handedOffState",
            "willReceiveProps",
            "didMount",
            "didUpdate",
            "willUnmount",
            "willUpdate",
            "shouldUpdate",
            "render",
            "initialState",
            "retainedProps",
            "reducer",
            "jsElementWrapped"
          ], [
            component$1[/* debugName */0],
            component$1[/* reactClassInternal */1],
            component$1[/* handedOffState */2],
            component$1[/* willReceiveProps */3],
            component$1[/* didMount */4],
            component$1[/* didUpdate */5],
            component$1[/* willUnmount */6],
            component$1[/* willUpdate */7],
            component$1[/* shouldUpdate */8],
            (function () {
                return Util$AgdaMode.sepBy(".", List.map((function (n) {
                                  return ReasonReact.element(undefined, undefined, make(n, /* array */[]));
                                }), List.append(value[0], /* :: */Block.simpleVariant("::", [
                                      value[1],
                                      /* [] */0
                                    ]))));
              }),
            component$1[/* initialState */10],
            component$1[/* retainedProps */11],
            component$1[/* reducer */12],
            component$1[/* jsElementWrapped */13]
          ]);
}

var QName = /* module */Block.localModule([
    "component",
    "make"
  ], [
    component$1,
    make$1
  ]);

exports.Name = Name;
exports.QName = QName;
/* component Not a pure module */