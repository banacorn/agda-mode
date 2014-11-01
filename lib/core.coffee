{EventEmitter} = require 'events'

# Components
Commander = require './commander'

class Core extends EventEmitter
    constructor: (@editor) ->
        # initialize all components
        @commander = new Commander

        console.log "[Core] initialized"

        @commander.on 'load', =>
            console.log "[Commander] load"

module.exports = Core
