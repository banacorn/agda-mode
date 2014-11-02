{EventEmitter} = require 'events'
Q = require 'Q'

# Components
Commander = require './commander'
Executable = require './executable'
Panel = require './panel'

class Core extends EventEmitter
    constructor: (@editor) ->

        # initialize all components
        @commander  = new Commander     @
        @executable = new Executable    @
        @panel      = new Panel         @

        # initialize informations about this editor
        @filePath = @editor.getPath()

        console.log "[Core] initialized"


        ##################
        #   Components   #
        ##################

        # Commander

        @commander.on 'load', =>
            console.log "[Commander] load"
            @executable.load().then (process) =>

        # Executable

        @executable.on 'info-action', (obj) =>
            switch obj.type
                when '*All Goals*'
                    console.log obj.content

module.exports = Core
