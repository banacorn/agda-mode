"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var AgdaParseError = (function (_super) {
    __extends(AgdaParseError, _super);
    function AgdaParseError(message) {
        var _this = _super.call(this, message) || this;
        _this.message = message;
        _this.name = 'AgdaParseError';
        Error.captureStackTrace(_this, AgdaParseError);
        return _this;
    }
    return AgdaParseError;
}(Error));
exports.AgdaParseError = AgdaParseError;
var NotLoadedError = (function (_super) {
    __extends(NotLoadedError, _super);
    function NotLoadedError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = 'NotLoadedError';
        Error.captureStackTrace(_this, NotLoadedError);
        return _this;
    }
    return NotLoadedError;
}(Error));
exports.NotLoadedError = NotLoadedError;
var OutOfGoalError = (function (_super) {
    __extends(OutOfGoalError, _super);
    function OutOfGoalError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = 'OutOfGoalError';
        Error.captureStackTrace(_this, OutOfGoalError);
        return _this;
    }
    return OutOfGoalError;
}(Error));
exports.OutOfGoalError = OutOfGoalError;
var EmptyGoalError = (function (_super) {
    __extends(EmptyGoalError, _super);
    function EmptyGoalError(message, goal) {
        var _this = _super.call(this, message) || this;
        _this.name = 'EmptyGoalError';
        Error.captureStackTrace(_this, EmptyGoalError);
        return _this;
    }
    return EmptyGoalError;
}(Error));
exports.EmptyGoalError = EmptyGoalError;
var QueryCancelledError = (function (_super) {
    __extends(QueryCancelledError, _super);
    function QueryCancelledError(message) {
        var _this = _super.call(this, message) || this;
        _this.message = message;
        _this.name = 'QueryCancelledError';
        Error.captureStackTrace(_this, QueryCancelledError);
        return _this;
    }
    return QueryCancelledError;
}(Error));
exports.QueryCancelledError = QueryCancelledError;
var InvalidExecutablePathError = (function (_super) {
    __extends(InvalidExecutablePathError, _super);
    function InvalidExecutablePathError(message, path) {
        var _this = _super.call(this, message) || this;
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
        _this.message = message;
        _this.name = 'AutoExecPathSearchError';
        _this.programName = programName;
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