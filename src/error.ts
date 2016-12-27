import { Goal } from './types';


// class AgdaParseError extends Error {
//     constructor(message: string) {
//         super(message);
//         this.message = message;
//         this.name = 'AgdaParseError';
//         Error.captureStackTrace(this, AgdaParseError);
//     }
// }
//

function AgdaParseError(message: string) {
    this.message = message;
    this.name = 'AgdaParseError';
    Error.captureStackTrace(this, AgdaParseError);
}
AgdaParseError.prototype = new Error();
AgdaParseError.prototype.constructor = AgdaParseError;

function OutOfGoalError(message: string) {
    this.message = message;
    this.name = 'OutOfGoalError';
    Error.captureStackTrace(this, OutOfGoalError);
}
OutOfGoalError.prototype = new Error();
OutOfGoalError.prototype.constructor = OutOfGoalError;

function NotLoadedError(message: string) {
    this.message = message;
    this.name = 'NotLoadedError';
    Error.captureStackTrace(this, NotLoadedError);
}
NotLoadedError.prototype = new Error();
NotLoadedError.prototype.constructor = NotLoadedError;

function EmptyGoalError(message: string, goal: Goal) {
    this.message = message;
    this.name = 'EmptyGoalError';
    this.goal = goal;
    Error.captureStackTrace(this, EmptyGoalError);
}
EmptyGoalError.prototype = new Error();
EmptyGoalError.prototype.constructor = EmptyGoalError;


function QueryCancelledError(message: string) {
    this.message = message;
    this.name = 'QueryCancelledError';
    Error.captureStackTrace(this, QueryCancelledError);
}
QueryCancelledError.prototype = new Error();
QueryCancelledError.prototype.constructor = QueryCancelledError;

class InvalidExecutablePathError extends Error {
    constructor(message: string, public path: string) {
        super(message);
        this.message = message;
        this.path = path;
        this.name = 'InvalidExecutablePathError';
        Error.captureStackTrace(this, InvalidExecutablePathError);
    }
}

class AutoExecPathSearchError extends Error {
    constructor(message: string, public programName: string) {
        super(message);
        this.message = message;
        this.programName = programName;
        this.name = 'AutoExecPathSearchError';
        Error.captureStackTrace(this, AutoExecPathSearchError);
    }
}

class ProcExecError extends Error {
    constructor(message: string) {
        super(message);
        this.message = message;
        this.name = 'ProcExecError';
        Error.captureStackTrace(this, ProcExecError);
    }
}

export {
    AgdaParseError,
    NotLoadedError,
    OutOfGoalError,
    EmptyGoalError,
    QueryCancelledError,
    InvalidExecutablePathError,
    AutoExecPathSearchError,
    ProcExecError
}
