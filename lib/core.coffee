{EventEmitter} = require 'events'
Q = require 'Q'
{log, warn, error} = require './logger'

# Components
Commander = require './commander'
Executable = require './executable'
Panel = require './panel'
TextBuffer = require './text-buffer'

class Core extends EventEmitter
    constructor: (@editor) ->

        # initialize all components
        @commander  = new Commander     @
        @executable = new Executable    @
        @panel      = new Panel         @
        @textBuffer = new TextBuffer    @

        # initialize informations about this editor
        @filePath = @editor.getPath()

        log 'Core', 'initialized'


        ##################
        #   Components   #
        ##################

        # Commander

        @commander.on 'load', =>
            log 'Commander', 'load'
            @executable.load().then (process) =>

        # Executable
        @executable.on 'info-action', (obj) => @panel.infoAction obj

        @executable.on 'goals-action', (obj) =>
            log 'Executable', obj

module.exports = Core
