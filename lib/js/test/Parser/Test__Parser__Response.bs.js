// Generated by BUCKLESCRIPT, PLEASE EDIT WITH CARE
'use strict';

var Curry = require("bs-platform/lib/js/curry.js");
var Belt_Array = require("bs-platform/lib/js/belt_Array.js");
var Mocha$BsMocha = require("bs-mocha/lib/js/src/Mocha.bs.js");
var Promise$BsMocha = require("bs-mocha/lib/js/src/Promise.bs.js");
var Response$AgdaMode = require("../../src/Response.bs.js");
var Test__Util$AgdaMode = require("../Test__Util.bs.js");
var Test__Parser__SExpression$AgdaMode = require("./Test__Parser__SExpression.bs.js");

function toResponses(exprs) {
  return Belt_Array.concatMany(Belt_Array.map(Belt_Array.map(exprs, Response$AgdaMode.parse), (function (param) {
                    if (param.tag) {
                      Curry._1(Test__Util$AgdaMode.Assert.fail, param[0]);
                      return [];
                    } else {
                      return [param[0]];
                    }
                  })));
}

Mocha$BsMocha.describe("when parsing responses")(undefined, undefined, undefined, (function (param) {
        return Belt_Array.forEach(Test__Util$AgdaMode.Golden.getGoldenFilepathsSync("test/Parser/Response"), (function (filepath) {
                      return Promise$BsMocha.it("should golden test " + filepath)(undefined, undefined, undefined, (function (param) {
                                    return Test__Util$AgdaMode.Golden.readFile(filepath).then((function (raw) {
                                                  var partial_arg = [];
                                                  return Test__Util$AgdaMode.Golden.compare(Test__Util$AgdaMode.Golden.map(Test__Util$AgdaMode.Golden.map(Test__Util$AgdaMode.Golden.map(raw, (function (param) {
                                                                            return Test__Parser__SExpression$AgdaMode.parseSExpression(partial_arg, param);
                                                                          })), toResponses), (function (param) {
                                                                    return Test__Util$AgdaMode.serializeWith(Response$AgdaMode.toString, param);
                                                                  })));
                                                }));
                                  }));
                    }));
      }));

exports.toResponses = toResponses;
/*  Not a pure module */
