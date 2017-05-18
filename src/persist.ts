import * as _ from 'lodash';

import { ConnectionInfo, GUID } from './type';

declare var atom: any;

export type Store = {
    connections: ConnectionInfo[];
    pinned: GUID;
    current: GUID;
}


export function get(): Store {
    return JSON.parse(atom.config.get('agda-mode.internalState')) as Store;
}

export function set(store: Store) {
    atom.config.set('agda-mode.internalState', JSON.stringify(store));
}

export function update(callback: (store: Store) => Store) {
    set(callback(get()));
}
