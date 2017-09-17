"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import { Transform } from "stream";
const stream_1 = require("stream");
class Rectifier extends stream_1.Transform {
    constructor() {
        super({ objectMode: true });
        this.buffer = "";
    }
    _transform(chunk, encoding, next) {
        const string = chunk.toString();
        // the prompt "Agda2> " should appear at the end of the response
        const endOfResponse = string.endsWith('Agda2> ');
        if (endOfResponse) {
            // omit "Agda2> " and append to the buffer
            this.buffer += string.substring(0, string.length - 7);
            // push and clear the buffer
            this.push(this.buffer);
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
//
// export default class Rectifier extends Transform {
//     private buffer: String;
//     constructor() {
//         super({ objectMode: true });
//         this.buffer = "";
//     }
//     _transform(chunk: any, encoding: string, next: Function): void {
//         this.buffer += chunk.toString();        // append to buffer
//         let lines = this.buffer.split('\n');    // lines
//
//         // leave the last line behind, as it may not be complete
//         _.initial(lines)
//             .map(function(line) {
//                 return line.replace('Agda2>', '').trim();
//             }).forEach((line) => {
//                 this.push(line);
//             });
//         this.buffer = _.last(lines);
//
//         next();
//     }
// }
//# sourceMappingURL=rectifier.js.map