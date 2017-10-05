import * as _ from 'lodash';

import { ConnectionInfo, GUID } from './type';

declare var atom: any;

export type Store = {
    connections: ConnectionInfo[];
    selected?: GUID;
    connected?: GUID;
    erred: GUID[];
}

// Example of legacy states before 0.7.2
const legacyExample = {"connections":[{"guid":"c887b1ba-39e1-4238-be4e-9ed054da2ded","uri":"/home/banacorn/.local/bin/agda","version":{"raw":"2.5.3","sem":"2.5.3"},"protocol":"Vanilla"}],"connected":"c887b1ba-39e1-4238-be4e-9ed054da2ded","erred":["c887b1ba-39e1-4238-be4e-9ed054da2ded"]};

function isLegacyState(state: any): boolean {
    return _.some(state['connections'], connInfo => {
        return connInfo['uri'] !== undefined || connInfo['agda'] === undefined;
    });
}

function updateLegacyConnectionInfo(connInfo: any): ConnectionInfo {
    if (connInfo.uri || connInfo.agda === undefined) {
        connInfo.agda = {
            location: connInfo.uri,
            version: connInfo.version
        };
        delete connInfo.uri;
        delete connInfo.version;
        delete connInfo.protocol;
        return connInfo;
    } else {
        return connInfo;
    }
}

function updateLegacyState(state: any): Store {
    state.connections = state.connections.map(updateLegacyConnectionInfo);
    return state;
}

export function get(): Store {
    if (atom.config.get('agda-mode.internalState')) {
        const state = JSON.parse(atom.config.get('agda-mode.internalState')) as Store;

        if (isLegacyState(state)) {
            const newState = updateLegacyState(state);
            set(newState);
        }
        return state;
    } else {
        initialize();
        return defaultStore;
    }
}

export function set(store: Store) {
    atom.config.set('agda-mode.internalState', JSON.stringify(store));
}

export function update(callback: (store: Store) => Store) {
    set(callback(get()));
}

export const defaultStore = {
    connections: [],
    erred: []
}

export function initialize() {
    set(defaultStore);
}
