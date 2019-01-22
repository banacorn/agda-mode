import { FileType } from '../type/agda';
import * as path from 'path';
import * as os from 'os';

function quoted(s: string): boolean {
  return (s.length > 2 && s[0] === "\"" && s[s.length - 1] === "\"");
}

function parseFilepath(s: string): string {
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
        // a hack to solve #75, quote the path if it contains spaces and is on Windows
        if (os.type() === "Windows_NT" && joined.indexOf(' ') >= 0 && !quoted(joined))
            joined = `"${joined}"`;
        return joined.trim();
    } else {
        return '';
    }
}

function parseFileType(filepath: string): FileType {
    if (/\.lagda.rst$/i.test(filepath)) {
        return FileType.LiterateReStructuredText;
    } else if (/\.lagda.md$/i.test(filepath)) {
        return FileType.LiterateMarkdown;
    } else if (/\.lagda.tex$|\.lagda$/i.test(filepath)) {
        return FileType.LiterateTeX;
    } else {
        return FileType.Agda;
    }
}

function parseUserInput(data: string): string {
    let expr = data.toString()
        .replace(/\\/g, '\\\\')
        .replace(/\\/g, '\\\\')      // \           => \\
        .replace(/\"/g, '\\"')       // "           => \"
        .replace(/\n/g, '\\n');      // newline     => \\n

    // trim spaces
    if (atom.config.get('agda-mode.trimSpaces'))
        return expr.trim();
    else
        return expr;
}


function parseAgdaInput(data: string): string {
    return data.replace(/\r\n/g, '\n').trim();
}

export {
    parseFileType,
    parseFilepath,
    parseUserInput,
    parseAgdaInput,
}
