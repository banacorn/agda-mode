
class OutOfGoalError extends Error
    constructor: (@message) ->
        @name = "OutOfGoalError"
        Error.captureStackTrace(this, OutOfGoalError)

class EmptyGoalError extends Error
    constructor: (@message) ->
        @name = "EmptyGoalERror"
        Error.captureStackTrace(this, OutOfGoalError)

module.exports =
    OutOfGoalError: OutOfGoalError
    EmptyGoalError: EmptyGoalError
