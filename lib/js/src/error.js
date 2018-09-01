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
var Conn;
(function (Conn) {
    class AutoSearchError extends Error {
        constructor(message, path) {
            super(message);
            this.path = path;
            this.message = message;
            this.path = path;
            this.name = 'Connection automatic searching error';
            Error.captureStackTrace(this, AutoSearchError);
        }
    }
    Conn.AutoSearchError = AutoSearchError;
    class NoPathGiven extends Error {
        constructor() {
            super();
            this.message = 'No path given';
            this.name = 'No path given error';
            Error.captureStackTrace(this, NoPathGiven);
        }
    }
    Conn.NoPathGiven = NoPathGiven;
    class NotEstablished extends Error {
        constructor() {
            super();
            this.message = 'Connection not established';
            this.name = 'Connection not established error';
            Error.captureStackTrace(this, NotEstablished);
        }
    }
    Conn.NotEstablished = NotEstablished;
    class Invalid extends Error {
        constructor(message, path) {
            super(message);
            this.path = path;
            this.message = message;
            this.name = 'Invalid connection error';
            Error.captureStackTrace(this, Invalid);
        }
    }
    Conn.Invalid = Invalid;
    class ConnectionError extends Error {
        constructor(message, path) {
            super(message);
            this.path = path;
            this.message = message;
            this.name = 'Connection error';
            Error.captureStackTrace(this, ConnectionError);
        }
    }
    Conn.ConnectionError = ConnectionError;
})(Conn = exports.Conn || (exports.Conn = {}));
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