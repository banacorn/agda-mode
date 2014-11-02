{EventEmitter} = require 'events'

class Commander extends EventEmitter
    constructor: (@core) ->
    load: -> @emit 'load'

module.exports = Commander
