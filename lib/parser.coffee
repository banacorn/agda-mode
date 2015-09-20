parseInputContent = (data) ->
    data.toString()
        .replace(/\\/g, '\\\\')     # \           => \\
        .replace(/\"/g, '\\"')      # "           => \"
        .replace(/\n/g, '\\n')      # newline     => \\n
        .replace(/^\s*$/, '')       # whitespaces => empty string

module.exports =
    inputContent: parseInputContent
