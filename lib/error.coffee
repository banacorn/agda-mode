
class OutOfGoalError extends Error
    constructor: (@message) ->
        @name = "OutOfGoalError"
        Error.captureStackTrace(this, OutOfGoalError)

class EmptyGoalError extends Error
    constructor: (@message) ->
        @name = "EmptyGoalERror"
        Error.captureStackTrace(this, OutOfGoalError)

class QueryCancelledError extends Error
    constructor: (@message) ->
        @name = "QueryCancelledError"
        Error.captureStackTrace(this, QueryCancelledError)

class InvalidExecutablePathError extends Error
    constructor: (@message, @path) ->
        @name = "InvalidExecutablePathError"
        Error.captureStackTrace(this, InvalidExecutablePathError)

module.exports =
    OutOfGoalError: OutOfGoalError
    EmptyGoalError: EmptyGoalError
    QueryCancelledError: QueryCancelledError
    InvalidExecutablePathError: InvalidExecutablePathError
