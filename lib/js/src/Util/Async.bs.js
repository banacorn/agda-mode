// Generated by BUCKLESCRIPT VERSION 5.0.4, PLEASE EDIT WITH CARE
'use strict';

var Block = require("bs-platform/lib/js/block.js");
var Curry = require("bs-platform/lib/js/curry.js");
var Util$AgdaMode = require("../Util.bs.js");

function make(callback) {
  return new Promise((function (resolve, param) {
                var resolve$prime = function (x) {
                  return resolve(/* Ok */Block.variant("Ok", 0, [x]));
                };
                var reject = function (x) {
                  return resolve(/* Error */Block.variant("Error", 1, [x]));
                };
                return Curry._2(callback, resolve$prime, reject);
              }));
}

function resolve(x) {
  return Promise.resolve(/* Ok */Block.variant("Ok", 0, [x]));
}

function reject(x) {
  return Promise.resolve(/* Error */Block.variant("Error", 1, [x]));
}

function lift(f, x) {
  var match = Curry._1(f, x);
  if (match.tag) {
    return Promise.resolve(/* Error */Block.variant("Error", 1, [match[0]]));
  } else {
    return Promise.resolve(/* Ok */Block.variant("Ok", 0, [match[0]]));
  }
}

function fromPromise(promise) {
  return promise.then((function (x) {
                return Promise.resolve(/* Ok */Block.variant("Ok", 0, [x]));
              }));
}

function then_(f, transformer) {
  return (function (param) {
      return param.then((function (param) {
                    if (param.tag) {
                      return Curry._1(transformer, param[0]);
                    } else {
                      return Curry._1(f, param[0]);
                    }
                  }));
    });
}

function map(f, g) {
  return (function (param) {
      return param.then((function (param) {
                    if (param.tag) {
                      var x = Curry._1(g, param[0]);
                      return Promise.resolve(/* Error */Block.variant("Error", 1, [x]));
                    } else {
                      var x$1 = Curry._1(f, param[0]);
                      return Promise.resolve(/* Ok */Block.variant("Ok", 0, [x$1]));
                    }
                  }));
    });
}

function pass(f) {
  return (function (param) {
      return param.then((function (param) {
                    if (param.tag) {
                      var e = param[0];
                      Curry._1(f, /* Error */Block.variant("Error", 1, [e]));
                      return Promise.resolve(/* Error */Block.variant("Error", 1, [e]));
                    } else {
                      var v = param[0];
                      Curry._1(f, /* Ok */Block.variant("Ok", 0, [v]));
                      return Promise.resolve(/* Ok */Block.variant("Ok", 0, [v]));
                    }
                  }));
    });
}

function mapOk(f) {
  return map(f, (function (e) {
                return e;
              }));
}

function passOk(f) {
  return pass((function (param) {
                if (param.tag) {
                  return /* () */0;
                } else {
                  return Curry._1(f, param[0]);
                }
              }));
}

function thenOk(f) {
  return then_(f, reject);
}

function finalOk(f, p) {
  then_((function (x) {
            var x$1 = Curry._1(f, x);
            return Promise.resolve(/* Ok */Block.variant("Ok", 0, [x$1]));
          }), reject)(p);
  return /* () */0;
}

function mapError(f) {
  return map((function (v) {
                return v;
              }), f);
}

function passError(f) {
  return pass((function (param) {
                if (param.tag) {
                  return Curry._1(f, param[0]);
                } else {
                  return /* () */0;
                }
              }));
}

function thenError(f) {
  return then_(resolve, f);
}

function finalError(f, p) {
  then_(resolve, (function (e) {
            var x = Curry._1(f, e);
            return Promise.resolve(/* Ok */Block.variant("Ok", 0, [x]));
          }))(p);
  return /* () */0;
}

function flatten(merge) {
  return (function (param) {
      return param.then((function (param) {
                    if (param.tag) {
                      var x = Curry._1(merge, /* Error */Block.variant("Error", 1, [param[0]]));
                      return Promise.resolve(/* Error */Block.variant("Error", 1, [x]));
                    } else {
                      var match = param[0];
                      if (match.tag) {
                        var x$1 = Curry._1(merge, /* Ok */Block.variant("Ok", 0, [match[0]]));
                        return Promise.resolve(/* Error */Block.variant("Error", 1, [x$1]));
                      } else {
                        return Promise.resolve(/* Ok */Block.variant("Ok", 0, [match[0]]));
                      }
                    }
                  }));
    });
}

function all(xs) {
  return Promise.all(xs).then((function (xs) {
                return Promise.resolve(Util$AgdaMode.Result[/* every */0](xs));
              }));
}

var P = 0;

exports.P = P;
exports.make = make;
exports.resolve = resolve;
exports.reject = reject;
exports.lift = lift;
exports.fromPromise = fromPromise;
exports.then_ = then_;
exports.map = map;
exports.pass = pass;
exports.mapOk = mapOk;
exports.passOk = passOk;
exports.thenOk = thenOk;
exports.finalOk = finalOk;
exports.mapError = mapError;
exports.passError = passError;
exports.thenError = thenError;
exports.finalError = finalError;
exports.flatten = flatten;
exports.all = all;
/* Util-AgdaMode Not a pure module */