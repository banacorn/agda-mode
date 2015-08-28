_ = require 'lodash'

regexHeader = /^(Goal|Have)\: ((?:\n|.)+)/
parseHeader = (str) ->
    result = str.match regexHeader
    label: result[1]
    type: result[2]

regexOccurence = /((?:\n|.)*\S+)\s*\[ at (.+):(?:(\d+)\,(\d+)\-(\d+)\,(\d+)|(\d+)\,(\d+)\-(\d+)) \]/
parseOccurence = (str) ->
    result = str.match regexOccurence
    if result
        body: result[1]
        location:
            path: result[2]
            rowStart: if result[3] then result[3] else result[7]
            rowEnd: if result[5] then result[5] else result[7]
            colStart: if result[4] then result[4] else result[8]
            colEnd: if result[6] then result[6] else result[9]
            isSameLine: result[3] is undefined

regexGoal = /^(\?\d+) \: ((?:\n|.)+)/
parseGoal = (str) ->
    result = str.match regexGoal
    if result
        index: result[1]
        body: result[2]
        type: 'goal'

regexTerm = /^([^\_\?].*) \: ((?:\n|.)+)/
parseTerm = (str) ->
    result = str.match regexTerm
    if result
        index: result[1]
        body: result[2]
        type: 'term'

regexMeta = /^(.+) \: ((?:\n|.)+)/
parseMeta = (str) ->
    occurence = parseOccurence str
    if occurence
        result = occurence.body.match regexMeta
        if result
            index: result[1]
            body: result[2]
            location: occurence.location
            type: 'meta'

regexTerm2 = /^((?:\n|.)+)/
parseTerm2 = (str) ->
    result = str.match regexTerm2
    if result
        index: result[1]
        type: 'term'

regexSort = /^Sort ((?:\n|.)+)/
parseSort = (str) ->
    occurence = parseOccurence str
    if occurence
        result = occurence.body.match regexSort
        if result
            index: result[1]
            location: occurence.location
            type: 'sort'

parseBody = (str) ->
    parseGoal(str) || parseTerm(str) || parseMeta(str) || parseTerm2(str) || parseSort(str)

regexLocation = /(?:(.+):)?(?:(\d+)\,(\d+)\-(\d+)\,(\d+)|(\d+)\,(\d+)\-(\d+))/
parseLocation = (str) ->
    result = str.match regexLocation
    if result
        path: result[1]
        rowStart: if result[2] then result[2] else result[6]
        rowEnd: if result[4] then result[4] else result[6]
        colStart: if result[3] then result[3] else result[7]
        colEnd: if result[5] then result[5] else result[8]
        isSameLine: result[2] is undefined

################################################################################
#   Error
################################################################################

regexNotInScope = /Not in scope\:\s+((?:\n|.)*)\s+at/
parseNotInScope = (str) ->
    result = str.match regexNotInScope
    if result
        errorType: 'not in scope'
        expr: result[1]

regexTypeMismatch = /((?:\n|.)*)\s+\!\=\<?\s+((?:\n|.)*)\s+of type\s+((?:\n|.)*)\s+when checking that the expression\s+((?:\n|.)*)\s+has type\s+((?:\n|.)*)/
parseTypeMismatch = (str) ->
    result = str.match regexTypeMismatch
    if result
        errorType: 'type mismatch'
        expected: result[2]
        actual: result[1]
        type: result[3]
        expr: result[4]
        exprType: result[5]

regexWrongConstructor = /The constructor\s+((?:\n|.)*)\s+does not construct an element of\s+((?:\n|.)*)\s+when checking that the expression\s+((?:\n|.)*)\s+has type\s+((?:\n|.)*)/
parseWrongConstructor = (str) ->
    result = str.match regexWrongConstructor
    if result
        errorType: 'wrong constructor'
        constructor: result[1]
        constructorType: result[2]
        expr: result[3]
        exprType: result[4]

regexApplicationParseError = /Could not parse the application\s+((?:\n|.)*)\s+when scope checking\s+((?:\n|.)*)/
parseApplicationParseError = (str) ->
    result = str.match regexApplicationParseError
    if result
        errorType: 'application parse error'
        expr: result[1]

regexTerminationError = /Termination checking failed for the following functions:\s+((?:\n|.)*)\s+Problematic calls:\s+((?:\n|.)*)\s+\(at (.*)\)/
parseTerminationError = (str) ->
    result = str.match regexTerminationError
    if result
        errorType: 'termination error'
        expr: result[1]
        call: result[2]
        callLocation: parseLocation result[3]

regexMissingDefinition = /Missing definition for\s+((?:\n|.)*)/
parseMissingDefinition = (str) ->
    result = str.match regexMissingDefinition
    if result
        errorType: 'missing definition'
        expr: result[1]

regexRhsOmitted = /The right-hand side can only be omitted if there is an absurd\s*pattern\, \(\) or \{\}\, in the left-hand side\.\s*when checking that the clause\s+((?:\n|.)*)\s+has type\s+((?:\n|.)*)/
parseRhsOmitted = (str) ->
    result = str.match regexRhsOmitted
    if result
        errorType: 'rhs omitted'
        expr: result[1]
        type: result[2]

regexParseError = /Parse error\s+((?:\n|.)*)\<ERROR\>\s+((?:\n|.)*)\.\.\./
parseParseError = (str) ->
    result = str.match regexParseError
    if result
        errorType: 'parse error'
        expr: result[1]
        post: result[2]

parseUnknownError = (str) ->
    errorType: 'unknown'
    raw: str

parseError = (strings) ->

    location = parseLocation strings[0]
    if location
        bulk = _.rest(strings).join('\n')
    else
        # the first line does not contains Location
        bulk = strings.join('\n')

    result = parseNotInScope(bulk) ||
        parseTypeMismatch(bulk) ||
        parseWrongConstructor(bulk) ||
        parseApplicationParseError(bulk) ||
        parseTerminationError(bulk) ||
        parseMissingDefinition(bulk) ||
        parseRhsOmitted(bulk) ||
        parseParseError(bulk) ||
        parseUnknownError(bulk)
    result.location = location
    return result

module.exports =
    parseHeader: parseHeader
    parseError: parseError
    parseBody: parseBody
