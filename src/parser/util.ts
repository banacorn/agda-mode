import * as path from "path";

function parseFilepath(s: string): string {
    if (s) {
        // sanitize with path.parse first
        const parsed = path.parse(s);
        // join it back and replace Windows' stupid backslash with slash
        let joined = path.join(parsed.dir, parsed.base).split(path.sep).join("/");
        // fuck Windows Bidi control character
        if (joined.charCodeAt(0) === 8234)
            joined = joined.substr(1);

        return joined.trim();
    } else {
        return "";
    }
}

function parseInputContent(data: string): string {
    let expr = data.toString()
        .replace(/\\/g, '\\\\')
        .replace(/\\/g, '\\\\')     // \           => \\
        .replace(/\"/g, '\\"')      // "           => \"
        .replace(/\n/g, '\\n');     // newline     => \\n

    // trim spaces
    if (atom.config.get('agda-mode.trimSpaces'))
        return expr.trim();
    else
        return expr;
}

export {
    parseInputContent,
    parseFilepath
}
