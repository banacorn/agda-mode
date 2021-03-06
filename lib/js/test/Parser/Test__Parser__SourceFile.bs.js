// Generated by BUCKLESCRIPT, PLEASE EDIT WITH CARE
'use strict';

var Belt_Array = require("bs-platform/lib/js/belt_Array.js");
var Mocha$BsMocha = require("bs-mocha/lib/js/src/Mocha.bs.js");
var Promise$BsMocha = require("bs-mocha/lib/js/src/Promise.bs.js");
var SourceFile$AgdaMode = require("../../src/SourceFile.bs.js");
var Test__Util$AgdaMode = require("../Test__Util.bs.js");

Mocha$BsMocha.describe("when parsing file paths")(undefined, undefined, undefined, (function (param) {
        return Mocha$BsMocha.it("should recognize the file extensions")(undefined, undefined, undefined, (function (param) {
                      Test__Util$AgdaMode.Assert.equal(undefined, SourceFile$AgdaMode.FileType.parse("a.agda"), /* Agda */0);
                      Test__Util$AgdaMode.Assert.equal(undefined, SourceFile$AgdaMode.FileType.parse("a.lagda"), /* LiterateTeX */1);
                      Test__Util$AgdaMode.Assert.equal(undefined, SourceFile$AgdaMode.FileType.parse("a.lagda.tex"), /* LiterateTeX */1);
                      Test__Util$AgdaMode.Assert.equal(undefined, SourceFile$AgdaMode.FileType.parse("a.lagda.md"), /* LiterateMarkdown */3);
                      Test__Util$AgdaMode.Assert.equal(undefined, SourceFile$AgdaMode.FileType.parse("a.lagda.rst"), /* LiterateRST */2);
                      return Test__Util$AgdaMode.Assert.equal(undefined, SourceFile$AgdaMode.FileType.parse("a.lagda.org"), /* LiterateOrg */4);
                    }));
      }));

Mocha$BsMocha.describe("when parsing source files")(undefined, undefined, undefined, (function (param) {
        return Belt_Array.forEach(Test__Util$AgdaMode.Golden.getGoldenFilepathsSync("test/Parser/SourceFile"), (function (filepath) {
                      return Promise$BsMocha.it("should golden test " + filepath)(undefined, undefined, undefined, (function (param) {
                                    return Test__Util$AgdaMode.Golden.readFile(filepath).then((function (raw) {
                                                  var partial_arg = [
                                                    0,
                                                    1,
                                                    2,
                                                    3,
                                                    4,
                                                    5,
                                                    6,
                                                    7,
                                                    8,
                                                    9
                                                  ];
                                                  return Test__Util$AgdaMode.Golden.compare(Test__Util$AgdaMode.Golden.map(Test__Util$AgdaMode.Golden.map(raw, (function (param) {
                                                                        return SourceFile$AgdaMode.parse(partial_arg, filepath, param);
                                                                      })), (function (param) {
                                                                    return Test__Util$AgdaMode.serializeWith(SourceFile$AgdaMode.Diff.toString, param);
                                                                  })));
                                                }));
                                  }));
                    }));
      }));

/*  Not a pure module */
