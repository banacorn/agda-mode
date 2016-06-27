"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var NotLoadedError = (function (_super) {
    __extends(NotLoadedError, _super);
    function NotLoadedError(message) {
        _super.call(this, message);
        this.name = "NotLoadedError";
        Error.captureStackTrace(this, NotLoadedError);
    }
    return NotLoadedError;
}(Error));
exports.NotLoadedError = NotLoadedError;
var OutOfGoalError = (function (_super) {
    __extends(OutOfGoalError, _super);
    function OutOfGoalError(message) {
        _super.call(this, message);
        this.name = "OutOfGoalError";
        Error.captureStackTrace(this, OutOfGoalError);
    }
    return OutOfGoalError;
}(Error));
exports.OutOfGoalError = OutOfGoalError;
var EmptyGoalError = (function (_super) {
    __extends(EmptyGoalError, _super);
    function EmptyGoalError(message, goal) {
        _super.call(this, message);
        this.name = "EmptyGoalError";
        Error.captureStackTrace(this, EmptyGoalError);
    }
    return EmptyGoalError;
}(Error));
exports.EmptyGoalError = EmptyGoalError;
var QueryCancelledError = (function (_super) {
    __extends(QueryCancelledError, _super);
    function QueryCancelledError(message) {
        _super.call(this, message);
        this.name = "QueryCancelledError";
        Error.captureStackTrace(this, QueryCancelledError);
    }
    return QueryCancelledError;
}(Error));
exports.QueryCancelledError = QueryCancelledError;
var InvalidExecutablePathError = (function (_super) {
    __extends(InvalidExecutablePathError, _super);
    function InvalidExecutablePathError(message) {
        _super.call(this, message);
        this.name = "InvalidExecutablePathError";
        Error.captureStackTrace(this, InvalidExecutablePathError);
    }
    return InvalidExecutablePathError;
}(Error));
exports.InvalidExecutablePathError = InvalidExecutablePathError;
var ProcExecError = (function (_super) {
    __extends(ProcExecError, _super);
    function ProcExecError(message) {
        _super.call(this, message);
        this.name = "ProcExecError";
        Error.captureStackTrace(this, ProcExecError);
    }
    return ProcExecError;
}(Error));
exports.ProcExecError = ProcExecError;
