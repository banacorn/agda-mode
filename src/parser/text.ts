export function inputContent(data: string): string {
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
