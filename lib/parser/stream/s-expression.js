"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var stream_1 = require('stream');
var lispToArray = require('lisp-to-array');
var SExpression = (function (_super) {
    __extends(SExpression, _super);
    function SExpression() {
        _super.call(this, { objectMode: true });
    }
    SExpression.prototype._transform = function (chunk, encoding, next) {
        this.push(postprocess(lispToArray(preprocess(chunk))));
        next();
    };
    return SExpression;
}(stream_1.Transform));
exports.SExpression = SExpression;
function preprocess(chunk) {
    if (chunk.startsWith("((last")) {
        var index = chunk.indexOf("(agda");
        var length_1 = chunk.length;
        chunk = chunk.substring(index, length_1 - 1);
    }
    if (chunk.startsWith("cannot read: ")) {
        chunk = chunk.substring(12);
        chunk = "(agda2-parse-error" + chunk + ")";
    }
    chunk = chunk.replace(/'\(/g, '(__number__ ');
    chunk = chunk.replace(/\("/g, '(__string__ "');
    chunk = chunk.replace(/\(\)/g, '(__nil__)');
    return chunk;
}
function postprocess(node) {
    if (node instanceof Array) {
        switch (node[0]) {
            case "`":
                return postprocess(node[1]);
            case "__number__":
            case "__string__":
            case "__nil__":
                node.shift();
                return postprocess(node);
            default:
                return node.map(function (x) { return postprocess(x); });
        }
    }
    else {
        if (typeof node === "string") {
            return node.replace("(__nil__)", "()");
        }
        else {
            return node;
        }
    }
}
