// import { NameId } from './common';
// import * as C from './concrete';
import * as P from './position';
import * as N from './notation';

////////////////////////////////////////////////////////////////////////////////
// Fixity

export type Fixity_ = {
    fixity: Fixity;
    notation: N.Notation;
    range: P.Range;
};

export type Fixity = {
    range: P.Range;
    level: PrecedenceLevel;
    assoc: Associativity;
};

////////////////////////////////////////////////////////////////////////////////
// PrecedenceLevel

export type PrecedenceLevel = null | number;

////////////////////////////////////////////////////////////////////////////////
// Associativity

export type Associativity = 'NonAssoc' | 'LeftAssoc' | 'RightAssoc';
