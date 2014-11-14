{EventEmitter} = require 'events'

class Commander extends EventEmitter
    constructor: (@core) ->
    load:           -> @emit 'load'
    quit:           -> @emit 'quit'
    restart:        -> @emit 'restart'
    nextGoal:       -> @emit 'next-goal'
    previousGoal:   -> @emit 'previous-goal'
    give:           -> @emit 'give'
    goalType:       -> @emit 'goal-type'
    context:        -> @emit 'context'
    goalTypeAndContext:         -> @emit 'goal-type-and-context'
    goalTypeAndInferredType:    -> @emit 'goal-type-and-inferred-type'
    refine:         -> @emit 'refine'
    case:           -> @emit 'case'
module.exports = Commander
