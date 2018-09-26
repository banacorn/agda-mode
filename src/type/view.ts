import { EmacsAgdaError } from '../parser/emacs/error';
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

export interface BodyState {
    metas: object;
    error: object;
    plainText: string;
    solutions: Solutions;
    emacsMetas: EmacsMetas;
    emacsError: EmacsAgdaError;
    emacsMessage: string;
    maxBodyHeight: number;
}

export type SettingsURI = {
    path: '/' | '/Connection' | '/Protocol' | '/Protocol/*';
    param?: number;
};

////////////////////////////////////////////
// Solutions
////////////////////////////////////////////

export type Solutions = SimpleSolutions | IndexedSolutions;
export type SimpleSolutions = {
    kind: 'SimpleSolutions';
    message: string,
    solutions: {
        index: number;
        expr: string;
    }[];
}
export type IndexedSolutions = {
    kind: 'IndexedSolutions';
    message: string,
    solutions: {
        index: number;
        combination: {
            goalIndex: number;
            expr: string;
        }[];
    }[];
}

////////////////////////////////////////////
// Expressions components
////////////////////////////////////////////

export type Expr = Goal | Judgement | Term | Meta | Sort;
export type ExprKind = 'goal' |
    'type judgement' |
    'meta' |
    'term' |
    'sort' ;

export interface Goal {
    judgementForm: ExprKind,
    type: string;
    index: string;
}

export interface Judgement {
    judgementForm: ExprKind,
    type: string;
    expr: string;
    index?: string;
}

export interface Term {
    judgementForm: ExprKind;
    expr: string;
}

export interface Meta {
    judgementForm: ExprKind;
    type: string;
    range: Agda.Range;
    index: string;
}

export interface Sort {
    judgementForm: ExprKind;
    range: Agda.Range;
    index: string;
}


////////////////////////////////////////////
// Body components
////////////////////////////////////////////

export interface EmacsMetas {
    goalAndHave: GoalAndHave[];
    // ------
    goals: Goal[];
    judgements: Judgement[];
    terms: Term[];
    metas: Meta[];
    sorts: Sort[];
    // --------
    warnings: string[];
    // --------
    errors: string[];
}

export interface GoalAndHave {
    type: string;
    label: string;
}
