"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
// import { Transform } from "stream";
var stream_1 = require("stream");
var _ = require("lodash");
var Rectifier = (function (_super) {
    __extends(Rectifier, _super);
    function Rectifier() {
        var _this = _super.call(this, { objectMode: true }) || this;
        _this.buffer = "";
        return _this;
    }
    Rectifier.prototype._transform = function (chunk, encoding, next) {
        var _this = this;
        this.buffer += chunk.toString(); // append to buffer
        var lines = this.buffer.split('\n'); // lines
        // leave the last line behind, as it may not be complete
        _.initial(lines)
            .map(function (line) {
            return line.replace('Agda2>', '').trim();
        }).forEach(function (line) {
            _this.push(line);
        });
        this.buffer = _.last(lines);
        next();
    };
    return Rectifier;
}(stream_1.Transform));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Rectifier;
//# sourceMappingURL=rectifier.js.map