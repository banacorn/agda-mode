"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Agda;
(function (Agda) {
    //
    //  QName
    //
    let Syntax;
    (function (Syntax) {
        class Range {
            constructor(obj) {
                this.intervals = obj.intervals;
                this.source = obj.source;
            }
            toString() {
                const lineNums = this.intervals.map((interval) => {
                    if (interval.start[0] === interval.end[0])
                        return `${interval.start[0]},${interval.start[1]}-${interval.end[1]}`;
                    else
                        return `${interval.start[0]},${interval.start[1]}-${interval.end[0]},${interval.end[1]}`;
                }).join(' ');
                if (this.source && lineNums) {
                    return `${this.source}:${lineNums}`;
                }
                if (this.source && lineNums === '') {
                    return `${this.source}`;
                }
                if (this.source === null) {
                    return `${lineNums}`;
                }
            }
        }
        Syntax.Range = Range;
        // export type Range = {
        // }
    })(Syntax = Agda.Syntax || (Agda.Syntax = {}));
})(Agda || (Agda = {}));
exports.Agda = Agda;
//# sourceMappingURL=type.js.map