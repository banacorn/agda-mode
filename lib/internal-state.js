"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
// Example of legacy states before 0.7.2
const legacyExample = { "connections": [{ "guid": "c887b1ba-39e1-4238-be4e-9ed054da2ded", "uri": "/home/banacorn/.local/bin/agda", "version": { "raw": "2.5.3", "sem": "2.5.3" }, "protocol": "Vanilla" }], "connected": "c887b1ba-39e1-4238-be4e-9ed054da2ded", "erred": ["c887b1ba-39e1-4238-be4e-9ed054da2ded"] };
function isLegacyState(state) {
    return _.some(state['connections'], connInfo => {
        return connInfo['uri'] !== undefined || connInfo['agda'] === undefined;
    });
}
function updateLegacyConnectionInfo(connInfo) {
    if (connInfo.uri || connInfo.agda === undefined) {
        connInfo.agda = {
            location: connInfo.uri,
            version: connInfo.version
        };
        delete connInfo.uri;
        delete connInfo.version;
        delete connInfo.protocol;
        return connInfo;
    }
    else {
        return connInfo;
    }
}
function updateLegacyState(state) {
    state.connections = state.connections.map(updateLegacyConnectionInfo);
    return state;
}
function get() {
    if (atom.config.get('agda-mode.internalState')) {
        const state = JSON.parse(atom.config.get('agda-mode.internalState'));
        if (isLegacyState(state)) {
            const newState = updateLegacyState(state);
            set(newState);
        }
        return state;
    }
    else {
        initialize();
        return exports.defaultInternalState;
    }
}
exports.get = get;
function set(state) {
    atom.config.set('agda-mode.internalState', JSON.stringify(state));
}
exports.set = set;
function update(callback) {
    set(callback(get()));
}
exports.update = update;
exports.defaultInternalState = {
    connections: [],
    erred: []
};
function initialize() {
    set(exports.defaultInternalState);
}
exports.initialize = initialize;
//# sourceMappingURL=internal-state.js.map