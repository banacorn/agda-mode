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

regexNotInScope = /Not in scope\:\s*((?:\n|.)*)\s*at/
parseNotInScope = (str) ->
    result = str.match regexNotInScope
    if result
        location: parseLocation str
        term: result[1]
        errorType: 'not in scope'

regexTypeMismatch = /\n\s*((?:\n|.)*)\s* \!\=\< \s*((?:\n|.)*)\s* of type \s*((?:\n|.)*)\s*\nwhen checking that the expression \s*((?:\n|.)*)\s* has type\n\s*((?:\n|.)*)\s*/
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

parseError = (str) -> parseNotInScope(str.join('\n')) || parseTypeMismatch(str.join('\n')) || raw: str

module.exports =
    parseHeader: parseHeader
    parseError: parseError
    parseBody: parseBody
