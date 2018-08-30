import { NamedArg } from './common';

////////////////////////////////////////////////////////////////////////////////
// Notation

export type Notation = GenPart[];

export type GenPart = GenPart_BindHole | GenPart_NormalHole |
    GenPart_WildHole | GenPart_IdPart;
export type GenPart_BindHole = {
    kind: 'BindHole';
    position: number;
};
export type GenPart_NormalHole = {
    kind: 'NormalHole';
    position: NamedArg<number>;
};
export type GenPart_WildHole = {
    kind: 'WildHole';
    position: number;
};
export type GenPart_IdPart = {
    kind: 'IdPart';
    rawName: string;
};
