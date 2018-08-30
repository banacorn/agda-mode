import * as A from './abstract';
import { MetaId } from './common';
import * as P from './position';
import * as Util from './../util';


////////////////////////////////////////////////////////////////////////////////
// Literal

export type Literal = Literal_Nat | Literal_Word64 | Literal_Float |
    Literal_String | Literal_Char | Literal_QName | Literal_Meta ;

export type Literal_Nat = {
    kind: 'LitNat';
    range: P.Range;
    value: number;
};

export type Literal_Word64 = {
    kind: 'LitWord64';
    range: P.Range;
    value: string;
};

export type Literal_Float = {
    kind: 'LitFloat';
    range: P.Range;
    value: number;
};

export type Literal_String = {
    kind: 'LitString';
    range: P.Range;
    value: string;
};

export type Literal_Char = {
    kind: 'LitChar';
    range: P.Range;
    value: string;
};

export type Literal_QName = {
    kind: 'LitQName';
    range: P.Range;
    value: A.QName;
};

export type Literal_Meta = {
    kind: 'LitMeta';
    range: P.Range;
    path: Util.AbsolutePath;
    metaId: MetaId;
};
