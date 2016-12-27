"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
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
var InvalidExecutablePathError = (function (_super) {
    __extends(InvalidExecutablePathError, _super);
    function InvalidExecutablePathError(message, path) {
        var _this = _super.call(this, message) || this;
        _this.path = path;
        _this.message = message;
        _this.path = path;
        _this.name = 'InvalidExecutablePathError';
        Error.captureStackTrace(_this, InvalidExecutablePathError);
        return _this;
    }
    return InvalidExecutablePathError;
}(Error));
exports.InvalidExecutablePathError = InvalidExecutablePathError;
var AutoExecPathSearchError = (function (_super) {
    __extends(AutoExecPathSearchError, _super);
    function AutoExecPathSearchError(message, programName) {
        var _this = _super.call(this, message) || this;
        _this.programName = programName;
        _this.message = message;
        _this.programName = programName;
        _this.name = 'AutoExecPathSearchError';
        Error.captureStackTrace(_this, AutoExecPathSearchError);
        return _this;
    }
    return AutoExecPathSearchError;
}(Error));
exports.AutoExecPathSearchError = AutoExecPathSearchError;
var ProcExecError = (function (_super) {
    __extends(ProcExecError, _super);
    function ProcExecError(message) {
        var _this = _super.call(this, message) || this;
        _this.message = message;
        _this.name = 'ProcExecError';
        Error.captureStackTrace(_this, ProcExecError);
        return _this;
    }
    return ProcExecError;
}(Error));
exports.ProcExecError = ProcExecError;
//# sourceMappingURL=error.js.map