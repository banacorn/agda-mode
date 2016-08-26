"use strict";
var goal_1 = require("./goal");
exports.Goal = goal_1.default;
var TokenType;
(function (TokenType) {
    TokenType[TokenType["Raw"] = 0] = "Raw";
    TokenType[TokenType["Comment"] = 1] = "Comment";
    TokenType[TokenType["GoalBracket"] = 2] = "GoalBracket";
    TokenType[TokenType["GoalQMRaw"] = 3] = "GoalQMRaw";
    TokenType[TokenType["GoalQM"] = 4] = "GoalQM";
})(TokenType || (TokenType = {}));
exports.TokenType = TokenType;
var View;
(function (View) {
    (function (Type) {
        Type[Type["PlainText"] = 0] = "PlainText";
        Type[Type["Error"] = 1] = "Error";
        Type[Type["Warning"] = 2] = "Warning";
        Type[Type["Judgement"] = 3] = "Judgement";
        Type[Type["Value"] = 4] = "Value";
    })(View.Type || (View.Type = {}));
    var Type = View.Type;
})(View || (View = {}));
exports.View = View;
//# sourceMappingURL=types.js.map