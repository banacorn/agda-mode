_ = require 'lodash'
Lexer = require './../lexer'
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


goalBracketContentRegex = /\{!([^!\}]*)!\}/

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
            token.content = '{!   !}'
            return token
        .mapOnly 'goal bracket', (token) => # {!!} => {!   !}
            # in case the goalIndex wasn't given, make it '*'
            # this happens when splitting case, agda2-goals-action is one index short
            goalIndex = indices[i] || '*'


            # {! zero 42!}
            #   <------>    hole content
            #         <>    index
            #        <->    space for index

            # count how much space the index would take
            requiredSpaces = goalIndex.toString().length

            # count how much space we have
            content = goalBracketContentRegex.exec(token.content)[1]
            actualSpaces = content.match(/\s*$/)[0].length

            # make room for the index, if there's not enough space
            if actualSpaces < requiredSpaces
                padding = ' '.repeat(requiredSpaces - actualSpaces)
                token.content = token.content.replace(/\{!.*!\}/, "{!#{content + padding}!}")

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
