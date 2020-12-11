// Generated by BUCKLESCRIPT, PLEASE EDIT WITH CARE
'use strict';

var $$Promise = require("reason-promise/lib/js/src/js/promise.js");
var Mocha$BsMocha = require("bs-mocha/lib/js/src/Mocha.bs.js");
var Assert$BsMocha = require("bs-mocha/lib/js/src/Assert.bs.js");
var Promise$BsMocha = require("bs-mocha/lib/js/src/Promise.bs.js");
var Instance$AgdaMode = require("../src/Instance.bs.js");
var Connection$AgdaMode = require("../src/Connection.bs.js");
var TaskRunner$AgdaMode = require("../src/Task/TaskRunner.bs.js");
var Test__Util$AgdaMode = require("./Test__Util.bs.js");
var Instance__Connections$AgdaMode = require("../src/Instance/Instance__Connections.bs.js");

Mocha$BsMocha.describe_skip("when loading files")(undefined, undefined, undefined, (function (param) {
        return Mocha$BsMocha.describe("when parsing responses from Agda")(undefined, undefined, undefined, (function (param) {
                      return Promise$BsMocha.it("should succeed")(undefined, undefined, undefined, (function (param) {
                                    var path = Test__Util$AgdaMode.Path.asset("Algebra.agda");
                                    return Test__Util$AgdaMode.$$File.open_(path).then((function (editor) {
                                                  var instance = Instance$AgdaMode.make(editor);
                                                  return $$Promise.Js.toBsPromise($$Promise.flatMap($$Promise.mapError($$Promise.mapOk($$Promise.mapOk($$Promise.mapOk($$Promise.flatMapOk(Connection$AgdaMode.autoSearch("agda"), (function (path) {
                                                                                        return Connection$AgdaMode.validateAndMake(path, [" --no-libraries"]);
                                                                                      })), Connection$AgdaMode.connect), Connection$AgdaMode.wire), (function (param) {
                                                                            return Instance__Connections$AgdaMode.persistConnection(instance, param);
                                                                          })), Assert$BsMocha.fail), (function (param) {
                                                                    return TaskRunner$AgdaMode.dispatchCommand(/* Load */0, instance);
                                                                  })));
                                                }));
                                  }));
                    }));
      }));

/*  Not a pure module */