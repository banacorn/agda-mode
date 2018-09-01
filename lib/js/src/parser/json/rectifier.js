"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
class Rectifier extends stream_1.Transform {
    constructor() {
        super({ objectMode: true });
        this.buffer = '';
    }
    _transform(chunk, _, next) {
        const string = chunk.toString();
        // the prompt "JSON> " should appear at the end of the response
        const endOfResponse = string.endsWith('JSON> ');
        if (endOfResponse) {
            // omit "JSON> " and append to the buffer
            this.buffer += string.substring(0, string.length - 7);
            // push and clear the buffer
            const parsedResponses = this.buffer.toString().split('\n')
                .filter(line => line.length > 0)
                .map(line => JSON.parse(line));
            this.push(parsedResponses);
            this.buffer = '';
        }
        else {
            // append to the buffer and wait until the end of the response
            this.buffer += string;
        }
        next();
    }
}
exports.default = Rectifier;
//# sourceMappingURL=rectifier.js.map