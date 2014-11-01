{EventEmitter} = require 'events'

# Components
Commander = require './commander'

class Core extends EventEmitter
    constructor: (@editor) ->
        # initialize all components
        @commander = new Commander
        
        console.log "[Core] initialized"

module.exports = Core
