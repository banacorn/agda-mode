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
    header: HeaderState;
    inputMethod: InputMethodState;
    query: QueryState;
    body: BodyState;
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

    pending: boolean;

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

export const enum Style {
    PlainText,
    Info,
    Success,
    Error,
    Warning
}

export interface HeaderState {
    text: string;
    style: Style;
}

export interface QueryState {
    placeholder: string;
    value: string;
}

export interface EmacsState {
    kind: 'AllGoalsWarnings' | 'GoalTypeContext' | 'Constraints' | 'Error' | 'WhyInScope' | 'GoToDefinition' | 'PlainText';
    header: string;
    body: string;
}

export interface JSONState {
    kind: 'AllGoalsWarnings' | 'Error' | 'PlainText';
    rawJSON: object;
    rawString: string;
}

export interface BodyState {
    maxBodyHeight: number;
    json: JSONState;
    emacs: EmacsState;
}

export type SettingsURI = {
    path: '/' | '/Connection' | '/Protocol' | '/Protocol/*';
    param?: number;
};
