"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function get() {
    return JSON.parse(atom.config.get('agda-mode.internalState'));
}
exports.get = get;
function set(store) {
    atom.config.set('agda-mode.internalState', JSON.stringify(store));
}
exports.set = set;
function update(callback) {
    set(callback(get()));
}
exports.update = update;
//# sourceMappingURL=persist.js.map