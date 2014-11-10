{EventEmitter} = require 'events'

#
#   "Pure" in the sense of not having any interaction with the text buffer
#   just text transformations only
#

# regular expressions
commentRegex = /(--[^\r\n]*[\r\n])/
goalBracketRegex = /(\{![^!\}]*!\})/
goalQuestionMarkGroupRegex =
    /// (
        [\s\(\{\_\;\.\"@]\?
        (?:\s\?)*
        [\s\)\}\_\;\.\"@]
    )///
goalQuestionMarkRegex =
    /// ([\s\(\{\_\;\.\"@])(?=\?)
        (\?[\s\)\}\_\;\.\"@])
    ///

empty = (content) -> content.replace(/\s/g, '').length is 0
escape = (content) -> content.replace(/\n/g, '\\n')

# Splits big chunks of raw text into tokens
class Lexer
    result: []

    # return : Text -> Token 'raw'
    constructor: (raw) ->
        @result = [{
            content: raw
            type: 'raw'
        }]

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



# findHoles : Text -> [(StartPosition, EndPosition)]
# returns positions of all holes {! !} in some text
findHoles = (text) ->

    tokens = new Lexer text
        .lex commentRegex, 'raw', 'comment'
        .lex goalBracketRegex, 'raw', 'goal bracket'
        .result

    # for counting character position
    pos = 0

    positions = tokens
        .map (obj) =>
            obj.start = pos
            pos += obj.content.length
            obj.end = pos
            return obj
        .filter (obj) => obj.type is 'goal bracket'
        .map (obj) => return {
            start: obj.start
            end: obj.end
        }
    return positions

# convertToHoles : Text -> Text
# convert all ? => {!!}
convertToHoles = (text) ->

    tokens = new Lexer text
        .lex commentRegex, 'raw', 'comment'
        .lex goalBracketRegex, 'raw', 'goal bracket'
        .lex goalQuestionMarkGroupRegex, 'raw', 'goal ?s'
        .lex goalQuestionMarkRegex, 'goal ?s', 'goal ?'
        .result

    text = tokens.map (obj) =>
            if obj.type is 'goal ?'
                obj.content = "{!  !}#{obj.content[1]}"
            return obj
        .map (obj) => obj.content
        .join('')

    return text

# resizeHoles : Text -> [Index] -> Text
# resize all holes to make room for goal indices {! asdsd __!}
resizeHoles = (text, indices) ->

    tokens = new Lexer text
        .lex commentRegex, 'raw', 'comment'
        .lex goalBracketRegex, 'raw', 'goal bracket'
        .result

    i = 0

    text = tokens.map (obj) =>
            if obj.type is 'goal bracket'
                # in case the goalIndex wasn't given, make it '*'
                # this happens when splitting case, agda2-goals-action is one index short
                goalIndex = indices[i] || '*'

                paddingSpaces = ' '.repeat(goalIndex.toString().length)

                # strip whitespaces in between {!<--space-->some data<---space-->!}
                content = /\{!(.*)!\}/.exec(obj.content)[1].replace(/^\s\s*/, '').replace(/\s\s*$/, '')

                obj.content = "{! #{content + paddingSpaces} !}"
                i += 1
            return obj
        .map (obj) => obj.content
        .join('')

    return text




module.exports =
    findHoles:      findHoles
    convertToHoles: convertToHoles
    resizeHoles:    resizeHoles
