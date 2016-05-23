"use strict";
var path = require("path");
function parseFilepath(s) {
    if (s) {
        var parsed = path.parse(s);
        var joined = path.join(parsed.dir, parsed.base).split(path.sep).join("/");
        if (joined.charCodeAt(0) === 8234)
            joined = joined.substr(1);
        return joined.trim();
    }
    else {
        return "";
    }
}
exports.parseFilepath = parseFilepath;
function parseInputContent(data) {
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
exports.parseInputContent = parseInputContent;
