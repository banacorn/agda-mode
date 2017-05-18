"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getStore() {
    return JSON.parse(atom.config.get('agda-mode.internalState'));
}
exports.getStore = getStore;
function setStore(store) {
    atom.config.set('agda-mode.internalState', JSON.stringify(store));
}
exports.setStore = setStore;
//# sourceMappingURL=persist.js.map