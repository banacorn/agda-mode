
class OutOfGoalError extends Error
    constructor: (@message) ->
        @name = "OutOfGoalError"
        Error.captureStackTrace(this, OutOfGoalError)

module.exports =
    OutOfGoalError: OutOfGoalError
