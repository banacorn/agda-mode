{EventEmitter} = require 'events'

class Commander extends EventEmitter
    constructor: (@core) ->
    load:           -> @emit 'load'
    quit:           -> @emit 'quit'
    restart:        -> @emit 'restart'
    nextGoal:       -> @emit 'next-goal'
    previousGoal:   -> @emit 'previous-goal'
module.exports = Commander
