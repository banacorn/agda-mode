import * as _ from 'lodash';

import { ConnectionInfo, GUID } from './type';

declare var atom: any;

export type Store = {
    connections: ConnectionInfo[];
    selected?: GUID;
    connected?: GUID;
}

export function get(): Store {
    if (atom.config.get('agda-mode.internalState')) {
        return JSON.parse(atom.config.get('agda-mode.internalState')) as Store;
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
    connections: []
}

export function initialize() {
    set(defaultStore);
}
