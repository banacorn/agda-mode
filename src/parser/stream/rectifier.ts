import { Transform } from 'stream';
import * as _ from 'lodash';

export class Rectifier extends Transform {
    private buffer: String;
    constructor() {
        super({ objectMode: true });
        this.buffer = "";
    }
    _transform(chunk: any, encoding: string, next: Function): void {
        this.buffer += chunk.toString();        // append to buffer
        let lines = this.buffer.split('\n');    // lines

        // leave the last line behind, as it may not be complete
        _.initial(lines)
            .map(function(line) {
                return line.replace('Agda2>', '').trim();
            }).forEach((line) => {
                this.push(line);
            });
        this.buffer = _.last(lines);

        next();
    }
}
