"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var stream_1 = require('stream');
var _ = require('lodash');
var Rectify = (function (_super) {
    __extends(Rectify, _super);
    function Rectify() {
        _super.call(this, { objectMode: true });
        this.buffer = "";
    }
    Rectify.prototype._transform = function (chunk, encoding, next) {
        var _this = this;
        this.buffer += chunk.toString();
        var lines = this.buffer.split('\n');
        _.initial(lines)
            .map(function (line) {
            return line.replace('Agda2>', '').trim();
        }).forEach(function (line) {
            _this.push(line);
        });
        this.buffer = _.last(lines);
        next();
    };
    return Rectify;
}(stream_1.Transform));
exports.Rectify = Rectify;
