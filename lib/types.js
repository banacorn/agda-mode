"use strict";
var goal_1 = require('./goal');
exports.Goal = goal_1.default;
//
//  View
//
var View;
(function (View) {
    (function (MountingPoint) {
        MountingPoint[MountingPoint["Pane"] = 0] = "Pane";
        MountingPoint[MountingPoint["Bottom"] = 1] = "Bottom";
    })(View.MountingPoint || (View.MountingPoint = {}));
    var MountingPoint = View.MountingPoint;
})(View || (View = {}));
exports.View = View;
//# sourceMappingURL=types.js.map