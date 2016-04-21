parseInputContent = (data) ->
    expr = data.toString()
        .replace(/\\/g, '\\\\')     # \           => \\
        .replace(/\"/g, '\\"')      # "           => \"
        .replace(/\n/g, '\\n')      # newline     => \\n

    # Trim spaces
    if atom.config.get('agda-mode.trimSpaces')
        return expr.trim()
    else
        return expr

module.exports =
    inputContent: parseInputContent
