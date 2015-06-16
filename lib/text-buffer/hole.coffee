_ = require 'lodash'

# regular expressions
commentRegex =
    /// (
        # single line comment
        --[^\r\n]*[\r\n]
    )|(
        # multi line comment
        \{-(?:[^-]|[\r\n]|(-+(?:[^-\}]|[\r\n])))*-+\}
    )///
goalBracketRegex = /(\{![^!\}]*!\})/
goalQuestionMarkRawRegex = /([\s\(\{\_\;\.\"@]\?)/
goalQuestionMarkRegex = /(\?)/

empty = (content) -> content.replace(/\s/g, '').length is 0
escape = (content) -> content.replace(/\n/g, '\\n')

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

getHoles = (text, indices) ->

    # for indices
    i = 0

    # just lexing, doesn't mess raw text around, preserves positions
    original = new Lexer text
        .lex commentRegex, 'raw', 'comment'
        .lex goalBracketRegex, 'raw', 'goal bracket'
        .lex goalQuestionMarkRawRegex, 'raw', 'goal raw ?'
        .lex goalQuestionMarkRegex, 'goal raw ?', 'goal ?'
        .result

    modified = new Lexer _.cloneDeep original
        .mapOnly 'goal ?', (token) ->   # ? => {!  !}
            token.type = 'goal bracket'
            token.content = '{!  !}'
            return token
        .mapOnly 'goal bracket', (token) => # {!!} => {!   !}
            # in case the goalIndex wasn't given, make it '*'
            # this happens when splitting case, agda2-goals-action is one index short
            goalIndex = indices[i] || '*'
            paddingSpaces = ' '.repeat(goalIndex.toString().length)
            # strip whitespaces in between {!<--space-->some data<---space-->!}
            content = /\{!(.*)!\}/.exec(token.content)[1].trim()
            # stuff whitespaces in
            token.content = token.content.replace(/\{!.*!\}/, "{! #{content + paddingSpaces} !}")
            i += 1;
            return token
        .result

    isHole = (token) ->
        token.type is 'goal ?' or token.type is 'goal bracket'

    originalHoles = original.filter isHole
    modifiedHoles = modified.filter isHole

    originalHoles.map (token, idx) =>
        modifiedHole = modifiedHoles[idx]
        return {
            goalIndex: indices[idx]
            originalRange:
                start: modifiedHole.range.start
                end: modifiedHole.range.start + token.content.length
            modifiedRange: modifiedHole.range
            content: modifiedHole.content
        }


module.exports =
    getHoles: getHoles
