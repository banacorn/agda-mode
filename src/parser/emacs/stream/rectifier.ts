// import { Transform } from "stream";
import { Transform } from "stream";

export default class Rectifier extends Transform {
    private buffer: String;
    constructor() {
        super({ objectMode: true });
        this.buffer = "";
    }
    _transform(chunk: any, _: string, next: Function): void {

        const string = chunk.toString();
        // the prompt "Agda2> " should appear at the end of the response
        const endOfResponse = string.endsWith('Agda2> ') || string.endsWith('JSON> ');
        if (endOfResponse) {
            // omit "Agda2> " and append to the buffer
            this.buffer += string.substring(0, string.length - 7);
            // push and clear the buffer
            this.push(this.buffer);
            this.buffer = '';
        } else {
            // append to the buffer and wait until the end of the response
            this.buffer += string;
        }
        next();
    }
}
