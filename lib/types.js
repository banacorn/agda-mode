"use strict";
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
})(exports.InfoActionType || (exports.InfoActionType = {}));
var InfoActionType = exports.InfoActionType;
