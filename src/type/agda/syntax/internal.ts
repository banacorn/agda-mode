import { Arg, ArgInfo, ConOrigin, Dom, Induction, MetaId, ProjOrigin } from './common';
import * as A from './abstract';
import * as L from './literal';

////////////////////////////////////////////////////////////////////////////////
// ConHead


export type ConHead = {
    name: A.QName;
    inductive: Induction;
    fields: Arg<A.QName>[];
};
export type ConInfo = ConOrigin

////////////////////////////////////////////////////////////////////////////////
// Term

export type Term = Term_Var | Term_Lam | Term_Lit | Term_Def | Term_Con | Term_Pi
    | Term_Sort | Term_Level | Term_MetaV | Term_DontCare | Term_Dummy ;

export type Term_Var = {
    kind: 'Var';
    index: number;
    elims: Elim[];
};
export type Term_Lam = {
    kind: 'Lam';
    argInfo: ArgInfo;
    binder: Abs<Term>;
};
export type Term_Lit = {
    kind: 'Lit';
    literal: L.Literal;
};
export type Term_Def = {
    kind: 'Def';
    name: A.QName;
    elims: Elim[];
};
export type Term_Con = {
    kind: 'Con';
    conHead: ConHead;
    conInfo: ConInfo;
    elims: Elim[];
};
export type Term_Pi = {
    kind: 'Pi';
    domain: Dom<Type>;
    binder: Abs<Type>;
}
export type Term_Sort = {
    kind: 'Sort';
    sort: Sort;
}
export type Term_Level = {
    kind: 'Level';
    level: Level;
}
export type Term_MetaV = {
    kind: 'MetaV';
    metaId: MetaId;
    elims: Elim[];
}
export type Term_DontCare = {
    kind: 'DontCare';
    term: Term;
}
export type Term_Dummy = {
    kind: 'Dummy';
    description: string;
}

////////////////////////////////////////////////////////////////////////////////
// Elim

export type Elim_<T> = Elim_Apply<T> | Elim_Proj | Elim_IApply<T>;
export type Elim_Apply<T> = {
    kind: 'Apply';
    arg: Arg<T>;
};
export type Elim_Proj = {
    kind: 'Proj';
    projOrigin: ProjOrigin;
    name: A.QName;
};
export type Elim_IApply<T> = {
    kind: 'IApply';
    endpoint1: T;
    endpoint2: T;
    endpoint3: T;
};

export type Elim = Elim_<Term>;

////////////////////////////////////////////////////////////////////////////////
// Abs

export type ArgName = string;
export type Abs<T> = Abs_Abs<T> | Abs_NoAbs<T>;
export type Abs_Abs<T> = {
    kind: 'Abs';
    name: ArgName;
    payload: T;
};
export type Abs_NoAbs<T> = {
    kind: 'NoAbs';
    name: ArgName;
    payload: T;
};


////////////////////////////////////////////////////////////////////////////////
// Type

export type Type_<T> = {
    sort: Sort;
    payload: T;
};
export type Type = Type_<Term>;

////////////////////////////////////////////////////////////////////////////////
// Sort

export type Sort = Sort_Type | Sort_Prop | Sort_Inf | Sort_SizeUniv |
    Sort_PiSort | Sort_UnivSort | Sort_MetaS;

export type Sort_Type = {
    kind: 'Type';
    level: Level;
};

export type Sort_Prop = {
    kind: 'Prop';
    level: Level;
};

export type Sort_Inf = {
    kind: 'Inf';
};

export type Sort_SizeUniv = {
    kind: 'SizeUniv';
};

export type Sort_PiSort = {
    kind: 'PiSort';
    sort: Sort;
    binder: Abs<Sort>;
};

export type Sort_UnivSort = {
    kind: 'UnivSort';
    sort: Sort;
};

export type Sort_MetaS = {
    kind: 'MetaS';
    sort: Sort;
    metaId: MetaId;
    elims: Elim[];
};

////////////////////////////////////////////////////////////////////////////////
// Level

export type Level = {
    levels: PlusLevel[];
}

export type PlusLevel = PlusLevel_ClosedLevel | PlusLevel_Plus;
export type PlusLevel_ClosedLevel = {
    kind: 'ClosedLevel';
    level:  number;
};
export type PlusLevel_Plus = {
    kind: 'Plus';
    level:  number;
    levelAtom: LevelAtom;
};

export type LevelAtom = LevelAtom_Meta | LevelAtom_Blocked | LevelAtom_Neutral |
    LevelAtom_Unreduced;
export type LevelAtom_Meta = {
    kind: 'MetaLevel';
    metaId: MetaId;
    elims: Elim[];
};
export type LevelAtom_Blocked = {
    kind: 'BlockedLevel';
    metaId: MetaId;
    term: Term;
};
export type LevelAtom_Neutral = {
    kind: 'NeutralLevel';
    notBlocked: NotBlocked;
    term: Term;
};
export type LevelAtom_Unreduced = {
    kind: 'UnreducedLevel';
    term: Term;
};

export type NotBlocked = NotBlocked_StuckOn | NotBlocked_Underapplied |
    NotBlocked_AbsurdMatch | NotBlocked_MissingClauses |
    NotBlocked_ReallyNotBlocked ;

export type NotBlocked_StuckOn = {
    kind: 'StuckOn';
    elims: Elim[];
};
export type NotBlocked_Underapplied = {
    kind: 'Underapplied';
};
export type NotBlocked_AbsurdMatch = {
    kind: 'AbsurdMatch';
};
export type NotBlocked_MissingClauses = {
    kind: 'MissingClauses';
};
export type NotBlocked_ReallyNotBlocked = {
    kind: 'ReallyNotBlocked';
};
