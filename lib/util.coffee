path = require 'path'

parsePath = (str) ->
    # sanitize by path.parse first
    parsed = path.parse str
    # join the path back and replace Windows' stupid backslash with slash
    joined = path.join(parsed.dir, parsed.base).split(path.sep).join('/')
    # fuck Windows Bidi control character
    joined = joined.substr(1) if joined.charCodeAt(0) is 8234
    return joined

module.exports =
    parsePath: parsePath
