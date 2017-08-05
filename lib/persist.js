"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function get() {
    if (atom.config.get('agda-mode.internalState')) {
        return JSON.parse(atom.config.get('agda-mode.internalState'));
    }
    else {
        initialize();
        return exports.defaultStore;
    }
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
exports.defaultStore = {
    connections: [],
    erred: []
};
function initialize() {
    set(exports.defaultStore);
}
exports.initialize = initialize;
//# sourceMappingURL=persist.js.map