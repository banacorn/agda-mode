{EventEmitter} = require 'events'

class Commander extends EventEmitter
    load: -> @emit 'load'

module.exports = Commander
