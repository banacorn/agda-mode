{EventEmitter} = require 'events'

class Commander extends EventEmitter
    constructor: (@core) ->
    load:       -> @emit 'load'
    quit:       -> @emit 'quit'
    restart:    -> @emit 'restart'

module.exports = Commander
