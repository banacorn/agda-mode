"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// for parsing related errors
class ParseError extends Error {
    constructor(raw, message) {
        super(message);
        this.raw = raw;
        this.message = message;
        this.name = 'Parse Error';
        Error.captureStackTrace(this, ParseError);
    }
}
exports.ParseError = ParseError;
class ConnectionError extends Error {
    constructor(message, kind, location, guid) {
        super(message);
        this.location = location;
        this.guid = guid;
        this.kind = kind || 'Generic';
        this.message = message;
        this.name = 'Connection Error';
        Error.captureStackTrace(this, ConnectionError);
    }
}
exports.ConnectionError = ConnectionError;
class OutOfGoalError extends Error {
    constructor(message) {
        super(message);
        this.message = message;
        this.name = 'OutOfGoalError';
        Error.captureStackTrace(this, OutOfGoalError);
    }
}
exports.OutOfGoalError = OutOfGoalError;
class NotLoadedError extends Error {
    constructor(message) {
        super(message);
        this.message = message;
        this.name = 'NotLoadedError';
        Error.captureStackTrace(this, NotLoadedError);
    }
}
exports.NotLoadedError = NotLoadedError;
class EmptyGoalError extends Error {
    constructor(message, goal) {
        super(message);
        this.goal = goal;
        this.message = message;
        this.name = 'EmptyGoalError';
        this.goal = goal;
        Error.captureStackTrace(this, EmptyGoalError);
    }
}
exports.EmptyGoalError = EmptyGoalError;
class QueryCancelled extends Error {
    constructor() {
        super('');
        this.message = '';
        this.name = 'QueryCancelled';
        Error.captureStackTrace(this, QueryCancelled);
    }
}
exports.QueryCancelled = QueryCancelled;
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