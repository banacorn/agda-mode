"use strict";
var goal_1 = require("./goal");
exports.Goal = goal_1.default;
(function (TokenType) {
    TokenType[TokenType["Raw"] = 0] = "Raw";
})(exports.TokenType || (exports.TokenType = {}));
var TokenType = exports.TokenType;
var Agda;
(function (Agda) {
    (function (ResponseType) {
        ResponseType[ResponseType["InfoAction"] = 0] = "InfoAction";
        ResponseType[ResponseType["StatusAction"] = 1] = "StatusAction";
        ResponseType[ResponseType["GoalsAction"] = 2] = "GoalsAction";
        ResponseType[ResponseType["GiveAction"] = 3] = "GiveAction";
        ResponseType[ResponseType["ParseError"] = 4] = "ParseError";
        ResponseType[ResponseType["Goto"] = 5] = "Goto";
        ResponseType[ResponseType["SolveAllAction"] = 6] = "SolveAllAction";
        ResponseType[ResponseType["MakeCaseAction"] = 7] = "MakeCaseAction";
        ResponseType[ResponseType["MakeCaseActionExtendLam"] = 8] = "MakeCaseActionExtendLam";
        ResponseType[ResponseType["HighlightClear"] = 9] = "HighlightClear";
        ResponseType[ResponseType["HighlightAddAnnotations"] = 10] = "HighlightAddAnnotations";
        ResponseType[ResponseType["HighlightLoadAndDeleteAction"] = 11] = "HighlightLoadAndDeleteAction";
        ResponseType[ResponseType["UnknownAction"] = 12] = "UnknownAction";
    })(Agda.ResponseType || (Agda.ResponseType = {}));
    var ResponseType = Agda.ResponseType;
    (function (InfoActionType) {
        InfoActionType[InfoActionType["AllGoals"] = 0] = "AllGoals";
        InfoActionType[InfoActionType["Error"] = 1] = "Error";
        InfoActionType[InfoActionType["TypeChecking"] = 2] = "TypeChecking";
        InfoActionType[InfoActionType["CurrentGoal"] = 3] = "CurrentGoal";
        InfoActionType[InfoActionType["InferredType"] = 4] = "InferredType";
        InfoActionType[InfoActionType["ModuleContents"] = 5] = "ModuleContents";
        InfoActionType[InfoActionType["Context"] = 6] = "Context";
        InfoActionType[InfoActionType["GoalTypeEtc"] = 7] = "GoalTypeEtc";
        InfoActionType[InfoActionType["NormalForm"] = 8] = "NormalForm";
        InfoActionType[InfoActionType["Intro"] = 9] = "Intro";
        InfoActionType[InfoActionType["Auto"] = 10] = "Auto";
        InfoActionType[InfoActionType["Constraints"] = 11] = "Constraints";
        InfoActionType[InfoActionType["ScopeInfo"] = 12] = "ScopeInfo";
    })(Agda.InfoActionType || (Agda.InfoActionType = {}));
    var InfoActionType = Agda.InfoActionType;
})(Agda || (Agda = {}));
exports.Agda = Agda;
var Command;
(function (Command) {
    (function (GoalSpecificCommandType) {
        GoalSpecificCommandType[GoalSpecificCommandType["Give"] = 0] = "Give";
    })(Command.GoalSpecificCommandType || (Command.GoalSpecificCommandType = {}));
    var GoalSpecificCommandType = Command.GoalSpecificCommandType;
})(Command || (Command = {}));
exports.Command = Command;
