"use strict";
// class AgdaParseError extends Error {
//     constructor(message: string) {
//         super(message);
//         this.message = message;
//         this.name = 'AgdaParseError';
//         Error.captureStackTrace(this, AgdaParseError);
//     }
// }
//
function AgdaParseError(message) {
    this.message = message;
    this.name = 'AgdaParseError';
    Error.captureStackTrace(this, AgdaParseError);
}
exports.AgdaParseError = AgdaParseError;
AgdaParseError.prototype = new Error();
AgdaParseError.prototype.constructor = AgdaParseError;
function OutOfGoalError(message) {
    this.message = message;
    this.name = 'OutOfGoalError';
    Error.captureStackTrace(this, OutOfGoalError);
}
exports.OutOfGoalError = OutOfGoalError;
OutOfGoalError.prototype = new Error();
OutOfGoalError.prototype.constructor = OutOfGoalError;
function NotLoadedError(message) {
    this.message = message;
    this.name = 'NotLoadedError';
    Error.captureStackTrace(this, NotLoadedError);
}
exports.NotLoadedError = NotLoadedError;
NotLoadedError.prototype = new Error();
NotLoadedError.prototype.constructor = NotLoadedError;
function EmptyGoalError(message, goal) {
    this.message = message;
    this.name = 'EmptyGoalError';
    this.goal = goal;
    Error.captureStackTrace(this, EmptyGoalError);
}
exports.EmptyGoalError = EmptyGoalError;
EmptyGoalError.prototype = new Error();
EmptyGoalError.prototype.constructor = EmptyGoalError;
function QueryCancelledError(message) {
    this.message = message;
    this.name = 'QueryCancelledError';
    Error.captureStackTrace(this, QueryCancelledError);
}
exports.QueryCancelledError = QueryCancelledError;
QueryCancelledError.prototype = new Error();
QueryCancelledError.prototype.constructor = QueryCancelledError;
class InvalidExecutablePathError extends Error {
    constructor(message, path) {
        super(message);
        this.path = path;
        this.message = message;
        this.path = path;
        this.name = 'InvalidExecutablePathError';
        Error.captureStackTrace(this, InvalidExecutablePathError);
    }
}
exports.InvalidExecutablePathError = InvalidExecutablePathError;
class AutoExecPathSearchError extends Error {
    constructor(message, programName) {
        super(message);
        this.programName = programName;
        this.message = message;
        this.programName = programName;
        this.name = 'AutoExecPathSearchError';
        Error.captureStackTrace(this, AutoExecPathSearchError);
    }
}
exports.AutoExecPathSearchError = AutoExecPathSearchError;
class ProcExecError extends Error {
    constructor(message) {
        super(message);
        this.message = message;
        this.name = 'ProcExecError';
        Error.captureStackTrace(this, ProcExecError);
    }
}
exports.ProcExecError = ProcExecError;
//# sourceMappingURL=error.js.map