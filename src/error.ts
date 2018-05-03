import Goal from './editor/goal';
import { Path } from './type';

// for parsing related errors
export class ParseError extends Error {
    public raw: string; // raw input
    constructor(raw: string, message: string) {
        super(message);
        this.raw = raw;
        this.message = message;
        this.name = 'Parse Error';
        Error.captureStackTrace(this, ParseError);
    }
}

export namespace Conn {
    export class AutoSearchError extends Error {
        constructor(message: string, public location: string) {
            super(message);
            this.message = message;
            this.name = 'Connection automatic searching error';
            Error.captureStackTrace(this, AutoSearchError);
        }
    }
    export class NoPathGiven extends Error {
        constructor() {
            super();
            this.message = 'No path given';
            this.name = 'No path given error';
            Error.captureStackTrace(this, NoPathGiven);
        }
    }
    export class NotEstablished extends Error {
        constructor() {
            super();
            this.message = 'Connection not established';
            this.name = 'Connection not established error';
            Error.captureStackTrace(this, NotEstablished);
        }
    }
    export class Invalid extends Error {
        constructor(message: string, public location: string) {
            super(message);
            this.message = message;
            this.name = 'Invalid connection error';
            Error.captureStackTrace(this, Invalid);
        }
    }
    export class ConnectionError extends Error {
        constructor(message: string, public path: Path) {
            super(message);
            this.message = message;
            this.name = 'Connection error';
            Error.captureStackTrace(this, ConnectionError);
        }
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


export class QueryCancelled extends Error {
    constructor() {
        super('');
        this.message = '';
        this.name = 'QueryCancelled';
        Error.captureStackTrace(this, QueryCancelled);
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
