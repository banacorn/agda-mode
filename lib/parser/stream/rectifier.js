"use strict";
// import { Transform } from "stream";
const stream_1 = require("stream");
const _ = require("lodash");
class Rectifier extends stream_1.Transform {
    constructor() {
        super({ objectMode: true });
        this.buffer = "";
    }
    _transform(chunk, encoding, next) {
        this.buffer += chunk.toString(); // append to buffer
        let lines = this.buffer.split('\n'); // lines
        // leave the last line behind, as it may not be complete
        _.initial(lines)
            .map(function (line) {
            return line.replace('Agda2>', '').trim();
        }).forEach((line) => {
            this.push(line);
        });
        this.buffer = _.last(lines);
        next();
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Rectifier;
//# sourceMappingURL=rectifier.js.map