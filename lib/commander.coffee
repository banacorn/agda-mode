{EventEmitter} = require 'events'

class Commander extends EventEmitter
    constructor: (@core) ->
    load: -> @emit 'load'
    quit: -> @emit 'quit'

module.exports = Commander
