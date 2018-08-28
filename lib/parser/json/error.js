"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function parseError(obj) {
    switch (obj['kind']) {
        case 'TypeError':
            return {
                kind: 'TypeError',
                typeError: undefined
            };
        case 'Exception':
            return {
                kind: 'Exception',
                message: obj['message']
            };
        case 'IOException':
            return {
                kind: 'IOException',
                message: obj['message']
            };
        case 'PatternError':
            return {
                kind: 'PatternError',
            };
    }
}
//# sourceMappingURL=error.js.map