import { NameId } from './common';
import * as C from './concrete';
import * as P from './position';
import * as F from './fixity';

////////////////////////////////////////////////////////////////////////////////
// Names

export type Name = {
    id: NameId;
    concrete: C.Name;
    bindingSite: P.Range;
    fixity: F.Fixity_;
}

export type QName = {
    module: ModuleName;
    name: Name;
}

export type ModuleName = Name[];
