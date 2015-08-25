_ = require 'lodash'
# Splits big chunks of raw text into tokens
class Lexer
    result: []

    # act as the 'return' in a Monad
    # accepts String or [Token]
    constructor: (raw) ->
        if typeof raw is 'string'
            @result = [{
                content: raw
                range:
                    start: 0
                    end: raw.length
                type: 'raw'
            }]
        else if Array.isArray(raw)
            @result = raw

    # break tokens down into smaller pieces
    #
    # splitRegex: Regex -- regex to perform split on a token
    # sourceType: String -- the type of token to look for and perform splitting
    # targetType: String -- the type of token given to the splitted tokens when identified
    lex: (regex, sourceType, targetType) ->
        temp = @result.map (token) =>
            if token.type is sourceType
                cursor = token.range.start  # trace ranges
                token.content
                    .split regex
                    .filter (tok) => tok
                    .map (tok, i) =>
                        type = if regex.test tok then targetType else sourceType
                        cursorOld = cursor
                        cursor += tok.length
                        return {
                            content: tok
                            range:
                                start: cursorOld
                                end: cursor
                            type: type
                        }
            else
                token
        @result = [].concat.apply([], temp) # concat : [[a]] -> [a]
        return @

    # map tokens with given function
    #
    # f : Token -> Token
    map: (f) ->
        delta = 0
        @result = @result.map (token) ->
            tokenNew = f _.cloneDeep token
            lengthDiff = tokenNew.content.length - token.content.length
            token.content = tokenNew.content
            token.type = tokenNew.type
            # update range
            token.range.start += delta
            delta += lengthDiff
            token.range.end += delta
            return token
        return @

    # map tokens of certain type
    mapOnly: (type, f) ->
        @map (token) =>
            if token.type is type
                f token
            else
                token

module.exports = Lexer
