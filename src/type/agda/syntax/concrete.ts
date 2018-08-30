import * as P from './position';

////////////////////////////////////////////////////////////////////////////////
// Names

export type NameId = {
    name: String;
    module: String;
};

export type NamePart = null | String;

export type Name = {
    kind: 'Name';
    range: P.Range;
    parts: NamePart[];
} | {
    kind: 'NoName';
    range: P.Range;
    name: NameId;
};

export type QName = Name[];


////////////////////////////////////////////////////////////////////////////////
// Potition & Interval

export type Position = [number, number, number] | [number, number];
export type Interval = {
    start: Position;
    end  : Position;
};
