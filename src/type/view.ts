import { Agda, Conn } from '../type';

export interface Parsed<T> {
    raw: string;
    parsed: T
}

export interface State {
    view: ViewState;
    mode: Mode;
    connection: ConnectionState;
    protocol: Protocol;
    inputMethod: InputMethodState;
    query: QueryState;
}

export interface ViewState {
    activated: boolean;
    mounted: boolean;
    mountAt: {
        previous: MountingPosition,
        current: MountingPosition
    };
    settingsView: boolean;
    settingsURI: SettingsURI;
}

export const enum Mode {
    Display,
    Query,
    QueryConnection
}

export interface ConnectionState {
    querying: boolean; // is agda-mode querying for the path to Agda?
    agda?: Conn.ValidPath;
    agdaMessage: string;
}

export interface Protocol {
    log: ReqRes[];
    id: number;// for indexing ReqRes
    limitLog: boolean;
}

// a request-response pair
export interface ReqRes {
    id: number;
    request: Parsed<Agda.Request>;
    responses: Parsed<Agda.Response>[];
}


export const enum MountingPosition {
    Pane,
    Bottom
}

export interface InputMethodState {
    activated: boolean;
    buffer: string;
    translation: string;
    further: boolean;
    keySuggestions: string[];
    candidateSymbols: string[];
}

export interface QueryState {
    placeholder: string;
    value: string;
}

export type SettingsURI = {
    path: '/' | '/Connection' | '/Protocol' | '/Protocol/*';
    param?: number;
};
