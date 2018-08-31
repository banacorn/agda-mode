import * as A from './syntax/abstract';
import * as C from './syntax/concrete';
import * as P from './syntax/position';

import * as Syntax from './syntax';
import { Term, Type } from './syntax/internal';

export type Comparison = 'CmpLeq' | 'CmpEq';

////////////////////////////////////////////////////////////////////////////////
// Error


export type Error =
    Error_TypeError |
    Error_Exception |
    Error_IOException |
    Error_PatternError ;

export interface Error_TypeError {
    kind: 'TypeError';
    range: Syntax.Position.Range;
    call: Closure<Call>
    typeError: TypeError;
}
export interface Error_Exception {
    kind: 'Exception';
    range: Syntax.Position.Range;
    message: String;
}
export interface Error_IOException {
    kind: 'IOException';
    range: Syntax.Position.Range;
    message: String;
}
export interface Error_PatternError {
    kind: 'PatternError';
    range: Syntax.Position.Range;
}

////////////////////////////////////////////////////////////////////////////////
// TypeError


export type TypeError =
    // ...
    TypeError_NotInScope        |
    TypeError_UnequalTerms      ;
    // ..

export interface TypeError_NotInScope {
    kind: 'NotInScope';
    payloads: {
        name: Syntax.Concrete.QName;
        range: Syntax.Position.Range;
        suggestions: Syntax.Concrete.QName[];
    }[];
}

export interface TypeError_UnequalTerms {
    kind: 'UnequalTerms';
    comparison: Comparison;
    term1: Term;
    term2: Term;
    type: Type;
    reason: string;
}


////////////////////////////////////////////////////////////////////////////////
// Call

export type Call = Call_CheckClause | Call_CheckPattern | Call_CheckLetBinding |
    Call_InferExpr | Call_CheckExprCall | Call_CheckDotPattern |
    Call_CheckPatternShadowing | Call_CheckProjection | Call_IsTypeCall |
    Call_IsType_ | Call_InferVar | Call_InferDef | Call_CheckArguments |
    Call_CheckTargetType | Call_CheckDataDef | Call_CheckRecDef |
    Call_CheckConstructor | Call_CheckFunDefCall | Call_CheckPragma |
    Call_CheckPrimitive | Call_CheckIsEmpty | Call_CheckWithFunctionType |
    Call_CheckSectionApplication | Call_CheckNamedWhere | Call_ScopeCheckExpr |
    Call_ScopeCheckDeclaration | Call_ScopeCheckLHS | Call_NoHighlighting |
    Call_ModuleContents | Call_SetRange;

export type Call_CheckClause = {
    kind: 'CheckClause';
    clause: string;
    type: string;
};
export type Call_CheckPattern = {
    kind: 'CheckPattern';
    pattern: string;
    telescope: string;
    type: string;
};

export type Call_CheckLetBinding = {
    kind: 'CheckLetBinding';
    binding: string;
};

export type Call_InferExpr = {
    kind: 'InferExpr';
    expr: string;
};

export type Call_CheckExprCall = {
    kind: 'CheckExprCall';
    comparison: Comparison;
    expr: string;
    type: string;
};

export type Call_CheckDotPattern = {
    kind: 'CheckDotPattern';
    expr: string;
    type: string;
};

export type Call_CheckPatternShadowing = {
    kind: 'CheckPatternShadowing';
    clause: string;
};

export type Call_CheckProjection = {
    kind: 'CheckProjection';
    range: P.Range;
    name: C.QName;
    type: string;
};

export type Call_IsTypeCall = {
    kind: 'IsTypeCall';
    expr: string;
    sort: string;
};

export type Call_IsType_ = {
    kind: 'IsType_';
    expr: string;
};


export type Call_InferVar = {
    kind: 'InferVar';
    name: C.Name;
};

export type Call_InferDef = {
    kind: 'InferDef';
    name: C.QName;
};

export type Call_CheckArguments = {
    kind: 'CheckArguments';
    range: P.Range;
    arguments: [string];
    type1: string;
    type2: string;
};

//
export type Call_CheckTargetType = {
    kind: 'CheckTargetType';
    range: P.Range;
    type1: string;
    type2: string;
};

export type Call_CheckDataDef = {
    kind: 'CheckDataDef';
    range: P.Range;
    name: C.Name;
    bindings: string;
    constructors: string;
};

export type Call_CheckRecDef = {
    kind: 'CheckRecDef';
    range: P.Range;
    name: C.Name;
    bindings: string;
    constructors: string;
};

export type Call_CheckConstructor = {
    kind: 'CheckConstructor';
    name: C.QName;
    telescope: string;
    sort: string;
    constructor: string;
};

export type Call_CheckFunDefCall = {
    kind: 'CheckFunDefCall';
    range: P.Range;
    name: C.Name;
    clauses: string;
};

export type Call_CheckPragma = {
    kind: 'CheckPragma';
    range: P.Range;
    pragma: string;
};

export type Call_CheckPrimitive = {
    kind: 'CheckPrimitive';
    range: P.Range;
    name: C.Name;
    expr: string;
};

export type Call_CheckIsEmpty = {
    kind: 'CheckIsEmpty';
    range: P.Range;
    type: string;
};

export type Call_CheckWithFunctionType = {
    kind: 'CheckWithFunctionType';
    expr: string;
};

export type Call_CheckSectionApplication = {
    kind: 'CheckSectionApplication';
    range: P.Range;
    module: A.ModuleName;
    moduleApplication: string;
};

export type Call_CheckNamedWhere = {
    kind: 'CheckNamedWhere';
    module: A.ModuleName;
};

export type Call_ScopeCheckExpr = {
    kind: 'ScopeCheckExpr';
    expr: string;
};

export type Call_ScopeCheckDeclaration = {
    kind: 'ScopeCheckDeclaration';
    niceDeclaration: string[];
};

export type Call_ScopeCheckLHS = {
    kind: 'ScopeCheckLHS';
    name: C.QName;
    pattern: string;
};

export type Call_NoHighlighting = {
    kind: 'NoHighlighting';
};

export type Call_ModuleContents = {
    kind: 'ModuleContents';
};

export type Call_SetRange = {
    kind: 'SetRange';
    range: P.Range;
};


////////////////////////////////////////////////////////////////////////////////
// Closure

export type Closure<T> = {
    signature: string;
    environment: null;
    scope: string;
    checkPoints: string;
    value: T;
};
