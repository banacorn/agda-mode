{EventEmitter} = require 'events'

#
#   "Pure" in the sense of not having any interaction with the text buffer
#

# regular expressions

commentRegex = /(--[^\r\n]*[\r\n])|(\{-([^-]|[\r\n]|(-+([^-\}]|[\r\n])))*-+\})/
goalBracketRegex = /(\{![^!\}]*!\})/
goalQuestionMarkGroupRegex =
    /// (
        [\s\(\{\_\;\.\"@]\?
        (?:\s\?)*
        [\s\)\}\_\;\.\"@]
    )///
goalQuestionMarkRegex =
    /// ([\s\(\{\_\;\.\"@]\?)
    ///

empty = (content) -> content.replace(/\s/g, '').length is 0
escape = (content) -> content.replace(/\n/g, '\\n')

# Splits big chunks of raw text into tokens
class Lexer
    result: []

    # return : Text -> [Token 'raw']
    # return : [Token] -> [Token]
    constructor: (raw) ->
        if typeof raw is 'string'
            @result = [{
                content: raw
                type: 'raw'
            }]
        else if Array.isArray(raw)
            @result = raw

    # lex : {source target: TokenType} -> Token source -> [Token target]
    lex: (regex, sourceTypeName, targetTypeName) ->
        pulp = @result.map (token) =>
            if token.type is sourceTypeName
                token.content
                    .split regex
                    .map (token, i) =>
                        if regex.test token
                            type = targetTypeName
                        else
                            type = sourceTypeName
                        return {
                            content: token
                            type: type
                        }
                    .filter (token) => token.content
            else
                token
        @result = [].concat.apply([], pulp)
        return @



findHoles = (text) ->
    tokens = new Lexer text
        .lex commentRegex, 'raw', 'comment'
        .lex goalBracketRegex, 'raw', 'goal bracket'
        .lex goalQuestionMarkGroupRegex, 'raw', 'goal ?s'
        .lex goalQuestionMarkRegex, 'goal ?s', 'goal ?'
        .result

    # tag original positions
    pos = 0
    tokens
        .map (obj) ->
            obj.start = pos
            pos += obj.content.length
            obj.end = pos
            return obj
        .filter (obj) -> obj.type is 'goal bracket' or obj.type is 'goal ?'

# convert all ? => {!!}
digHoles = (tokens) -> tokens.map (obj) =>
    if obj.type is 'goal ?'
        obj.modifiedContent = "#{obj.content[0]}{!  !}"
        obj.type = 'goal bracket'
    else
        obj.modifiedContent = obj.content
    return obj

# resize holes to make room for goal indices {! asdsd __!}
resizeHoles = (tokens, indices) ->

    i = 0
    tokens.map (obj) =>
        # in case the goalIndex wasn't given, make it '*'
        # this happens when splitting case, agda2-goals-action is one index short
        goalIndex = indices[i] || '*'
        paddingSpaces = ' '.repeat(goalIndex.toString().length)
        # strip whitespaces in between {!<--space-->some data<---space-->!}
        content = /\{!(.*)!\}/.exec(obj.modifiedContent)[1].replace(/^\s\s*/, '').replace(/\s\s*$/, '')

        # there might exists prefix before '{!', measure and erase them
        prefix = obj.modifiedContent.match(/^(.*)\{!/)[1]
        obj.start += prefix.length
        obj.content = obj.content.substr(prefix.length)

        # reorganize the contents inside the brackets
        obj.modifiedContent = obj.modifiedContent.replace(/\{!.*!\}/, "{! #{content + paddingSpaces} !}").substr(prefix.length)

        i += 1
        return obj


module.exports =
    findHoles:      findHoles
    digHoles:       digHoles
    resizeHoles:    resizeHoles
