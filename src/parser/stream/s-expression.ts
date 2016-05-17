import { Transform } from 'stream';
import * as _ from 'lodash';
var lispToArray = require('lisp-to-array');

export class SExpression extends Transform {

    constructor() {
        super({ objectMode: true });
    }
    _transform(chunk: string, encoding: string, next: Function): void {
        this.push(postprocess(lispToArray(preprocess(chunk))));
        next();
    }
}

function preprocess(chunk) {
    if (chunk.startsWith("((last")) {
        // drop wierd prefix like ((last . 1))
        let index = chunk.indexOf("(agda");
        let length = chunk.length
        chunk = chunk.substring(index, length - 1);
    }
    if (chunk.startsWith("cannot read: ")) {
        // handles Agda parse error
        chunk = chunk.substring(12);
        chunk = `(agda2-parse-error${chunk})`;
    }
    // make it friendly to 'lisp-to-array' package
    chunk = chunk.replace(/'\(/g, '(__number__ ');
    chunk = chunk.replace(/\("/g, '(__string__ "');
    chunk = chunk.replace(/\(\)/g, '(__nil__)');

    return chunk;
}

// recursive cosmetic surgery
function postprocess(node) {
    if (node instanceof Array) {
        switch (node[0]) {
            case "`":           // ["`", "some string"] => "some string"
                return postprocess(node[1]);
            case "__number__":  // ["__number__", 1, 2, 3] => [1, 2, 3]
            case "__string__":  // ["__string__", 1, 2, 3] => [1, 2, 3]
            case "__nil__":     // ["__nil__"]             => []
                node.shift();
                return postprocess(node);
            default:            // keep traversing
                return node.map(function(x) { return postprocess(x); });
        }
    } else {
        if (typeof node === "string") {
            // some ()s in strings were replaced with (__nil__) when preprocessing
            return node.replace("(__nil__)", "()");
        } else {
            return node;
        }
    }
}
