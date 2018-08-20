"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
function parseFilepath(s) {
    if (s) {
        // remove newlines
        s = s.replace('\n', '');
        // sanitize with path.parse first
        const parsed = path.parse(s);
        // join it back and replace Windows' stupid backslash with slash
        let joined = path.join(parsed.dir, parsed.base).split(path.sep).join('/');
        // fuck Windows Bidi control character
        if (joined.charCodeAt(0) === 8234)
            joined = joined.substr(1);
        return joined.trim();
    }
    else {
        return '';
    }
}
exports.parseFilepath = parseFilepath;
function parseFileType(filepath) {
    if (/\.lagda.rst$/i.test(filepath)) {
        return 2 /* LiterateReStructuredText */;
    }
    else if (/\.lagda.md$/i.test(filepath)) {
        return 3 /* LiterateMarkdown */;
    }
    else if (/\.lagda.tex$|\.lagda$/i.test(filepath)) {
        return 1 /* LiterateTeX */;
    }
    else {
        return 0 /* Agda */;
    }
}
exports.parseFileType = parseFileType;
function parseInputContent(data) {
    let expr = data.toString()
        .replace(/\\/g, '\\\\')
        .replace(/\\/g, '\\\\') // \           => \\
        .replace(/\"/g, '\\"') // "           => \"
        .replace(/\n/g, '\\n'); // newline     => \\n
    // trim spaces
    if (atom.config.get('agda-mode.trimSpaces'))
        return expr.trim();
    else
        return expr;
}
exports.parseInputContent = parseInputContent;
//# sourceMappingURL=util.js.map