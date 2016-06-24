import { Goal } from "./types";

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

class ProcExecError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ProcExecError";
        Error.captureStackTrace(this, ProcExecError);
    }
}

export {
    OutOfGoalError,
    EmptyGoalError,
    QueryCancelledError,
    InvalidExecutablePathError,
    ProcExecError
}
