{EventEmitter} = require 'events'
{Q} = require 'Q'
# Components
Commander = require './commander'
Executable = require './executable'

class Core extends EventEmitter
    constructor: (@editor) ->
        # initialize all components
        @commander  = new Commander
        @executable = new Executable

        console.log "[Core] initialized"

        @commander.on 'load', =>
            console.log "[Commander] load"
            @executable.load()

        @executable.on 'query executable path', =>
            console.log "[Core] executable querying executable path"



module.exports = Core
