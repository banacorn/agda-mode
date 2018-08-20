"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
class Rectifier extends stream_1.Transform {
    constructor() {
        super({ objectMode: true });
    }
    _transform(chunk, _, next) {
        const lines = chunk.toString().split('\n');
        lines.forEach(line => {
            if (line !== 'JSON> ' && line !== '') {
                this.push(JSON.parse(line));
            }
        });
        //
        // // the prompt "Agda2> " should appear at the end of the response
        // const endOfResponse = string.endsWith('JSON> ');
        // if (endOfResponse) {
        //     // omit "Agda2> " and append to the buffer
        //     this.buffer += string.substring(0, string.length - 7);
        //     // push and clear the buffer
        //     this.buffer = '';
        // } else {
        //     // append to the buffer and wait until the end of the response
        //     this.buffer += string;
        // }
        next();
    }
}
exports.default = Rectifier;
//# sourceMappingURL=jsonifier.js.map