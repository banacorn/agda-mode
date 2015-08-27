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
    {body, location} = parseOccurence str
    result = body.match regexMeta
    if result
        index: result[1]
        body: result[2]
        location: location
        type: 'meta'

regexSort = /^Sort ((?:\n|.)+)/
parseSort = (str) ->
    {body, location} = parseOccurence str
    result = body.match regexSort
    if result
        index: result[1]
        location: location
        type: 'sort'

parseBody = (str) -> parseGoal(str) || parseTerm(str) || parseMeta(str) || parseSort(str)

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
        location: parseLocation str
        term: result[1]
        errorType: 'not in scope'

regexTypeMismatch = /\s+((?:\n|.)*)\s+\!\=\<?\s+((?:\n|.)*)\s+of type\s+((?:\n|.)*)\s+when checking that the expression\s+((?:\n|.)*)\s+has type\s+((?:\n|.)*)/
parseTypeMismatch = (str) ->
    result = str.match regexTypeMismatch
    if result
        location: parseLocation str
        expected: result[2]
        actual: result[1]
        type: result[3]
        term: result[4]
        termType: result[5]
        errorType: 'type mismatch'

regexWrongConstructor = /The constructor\s+((?:\n|.)*)\s+does not construct an element of\s+((?:\n|.)*)\s+when checking that the expression\s+((?:\n|.)*)\s+has type\s+((?:\n|.)*)/
parseWrongConstructor = (str) ->
    result = str.match regexWrongConstructor
    if result
        location: parseLocation str
        constructor: result[1]
        constructorType: result[2]
        term: result[3]
        termType: result[4]
        errorType: 'wrong constructor'

regexApplicationParseError = /\s*Could not parse the application\s+((?:\n|.)*)\s+when scope checking\s+((?:\n|.)*)/
parseApplicationParseError = (str) ->
    result = str.match regexApplicationParseError
    if result
        location: parseLocation str
        term: result[1]
        errorType: 'application parse error'

regexTerminationError = /\s*Termination checking failed for the following functions:\s+((?:\n|.)*)\s+Problematic calls:\s+((?:\n|.)*)\s+\(at (.*)\)/
parseTerminationError = (str) ->
    result = str.match regexTerminationError
    if result
        location: parseLocation str
        term: result[1]
        call: result[2]
        callLocation: parseLocation result[3]
        errorType: 'termination error'

regexMissingDefinition = /\s*Missing definition for\s+((?:\n|.)*)/
parseMissingDefinition = (str) ->
    result = str.match regexMissingDefinition
    if result
        location: parseLocation str
        term: result[1]
        errorType: 'missing definition'

regexRhsOmitted = /\s*The right-hand side can only be omitted if there is an absurd\s*pattern\, \(\) or \{\}\, in the left-hand side\.\s*when checking that the clause\s+((?:\n|.)*)\s+has type\s+((?:\n|.)*)/
parseRhsOmitted = (str) ->
    result = str.match regexRhsOmitted
    if result
        location: parseLocation str
        term: result[1]
        type: result[2]
        errorType: 'rhs omitted'

parseUnknownError = (strings) ->
    location: parseLocation strings[0]
    raw: _.rest(strings).join('\n')
    errorType: 'unknown'

parseError = (str) ->
    bulk = str.join('\n')

    parseNotInScope(bulk) ||
    parseTypeMismatch(bulk) ||
    parseWrongConstructor(bulk) ||
    parseApplicationParseError(bulk) ||
    parseTerminationError(bulk) ||
    parseMissingDefinition(bulk) ||
    parseRhsOmitted(bulk) ||
    parseUnknownError(str)

module.exports =
    parseHeader: parseHeader
    parseError: parseError
    parseBody: parseBody
