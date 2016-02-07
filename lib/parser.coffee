parseInputContent = (data) ->
    data.toString()
        .replace(/\\/g, '\\\\')     # \           => \\
        .replace(/\"/g, '\\"')      # "           => \"
        .replace(/\n/g, '\\n')      # newline     => \\n

module.exports =
    inputContent: parseInputContent
