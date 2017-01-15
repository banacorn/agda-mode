import { Goal } from './types';


export class AgdaParseError extends Error {
    constructor(message: string) {
        super(message);
        this.message = message;
        this.name = 'AgdaParseError';
        Error.captureStackTrace(this, AgdaParseError);
    }
}

export class OutOfGoalError extends Error {
    constructor(message: string) {
        super(message);
        this.message = message;
        this.name = 'OutOfGoalError';
        Error.captureStackTrace(this, OutOfGoalError);
    }
}

export class NotLoadedError extends Error {
    constructor(message: string) {
        super(message);
        this.message = message;
        this.name = 'NotLoadedError';
        Error.captureStackTrace(this, NotLoadedError);
    }
}

export class EmptyGoalError extends Error {
    constructor(message: string, public goal: Goal) {
        super(message);
        this.message = message;
        this.name = 'EmptyGoalError';
        this.goal = goal;
        Error.captureStackTrace(this, EmptyGoalError);
    }
}


export class QueryCancelledError extends Error {
    constructor(message: string) {
        super(message);
        this.message = message;
        this.name = 'QueryCancelledError';
        Error.captureStackTrace(this, QueryCancelledError);
    }
}

export class InvalidExecutablePathError extends Error {
    constructor(message: string, public path: string) {
        super(message);
        this.message = message;
        this.path = path;
        this.name = 'InvalidExecutablePathError';
        Error.captureStackTrace(this, InvalidExecutablePathError);
    }
}

export class AutoExecPathSearchError extends Error {
    constructor(message: string, public programName: string) {
        super(message);
        this.message = message;
        this.programName = programName;
        this.name = 'AutoExecPathSearchError';
        Error.captureStackTrace(this, AutoExecPathSearchError);
    }
}

export class ProcExecError extends Error {
    constructor(message: string) {
        super(message);
        this.message = message;
        this.name = 'ProcExecError';
        Error.captureStackTrace(this, ProcExecError);
    }
}
