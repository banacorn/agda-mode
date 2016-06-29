import { Goal } from "./types";


class NotLoadedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "NotLoadedError";
        Error.captureStackTrace(this, NotLoadedError);
    }
}

class OutOfGoalError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "OutOfGoalError";
        Error.captureStackTrace(this, OutOfGoalError);
    }
}

class EmptyGoalError extends Error {
    constructor(message: string, goal: Goal) {
        super(message);
        this.name = "EmptyGoalError";
        Error.captureStackTrace(this, EmptyGoalError);
    }
}

class QueryCancelledError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "QueryCancelledError";
        Error.captureStackTrace(this, QueryCancelledError);
    }
}

class InvalidExecutablePathError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "InvalidExecutablePathError";
        Error.captureStackTrace(this, InvalidExecutablePathError);
    }
}

class AutoExecPathSearchError extends Error {
    programName: string;
    constructor(message: string, programName: string) {
        super(message);
        this.name = "AutoExecPathSearchError";
        this.programName = programName;
        Error.captureStackTrace(this, AutoExecPathSearchError);
    }
}

class ProcExecError extends Error {
    constructor(message: string) {
        super(message);
        this.message = message;
        this.name = "ProcExecError";
        Error.captureStackTrace(this, ProcExecError);
    }
}

export {
    NotLoadedError,
    OutOfGoalError,
    EmptyGoalError,
    QueryCancelledError,
    InvalidExecutablePathError,
    AutoExecPathSearchError,
    ProcExecError
}
