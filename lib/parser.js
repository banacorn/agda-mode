"use strict";
function inputContent(data) {
    var expr = data.toString()
        .replace(/\\/g, '\\\\')
        .replace(/\\/g, '\\\\')
        .replace(/\"/g, '\\"')
        .replace(/\n/g, '\\n');
    if (atom.config.get('agda-mode.trimSpaces'))
        return expr.trim();
    else
        return expr;
}
exports.inputContent = inputContent;
