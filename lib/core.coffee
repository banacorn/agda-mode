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

        log 'Core', 'initialized:', @filePath




        #####################
        #   Editor Events   #
        #####################


        @on 'activate', =>
            log 'Core', 'activated:', @filePath
            @panel.show()
        @on 'deactivate', =>
            log 'Core', 'deactivated:', @filePath
            @panel.hide()




        ########################
        #   Components Events  #
        ########################



        # Commander
        @commander.on 'load', =>
            log 'Commander', 'load'
            @executable.load().then (process) =>
                @panel.show()

        @commander.on 'quit', =>
            log 'Commander', 'quit'
            @executable.quit()
            @panel.hide()
            @textBuffer.removeGoals()

        @commander.on 'restart', =>
            log 'Commander', 'restart'
            @commander.quit()
            @commander.load()

        @commander.on 'next-goal', =>
            log 'Commander', 'next-goal'
            @textBuffer.nextGoal()

        @commander.on 'previous-goal', =>
            log 'Commander', 'previous-goal'
            @textBuffer.previousGoal()

        @commander.on 'give', =>
            log 'Commander', 'give'
            @textBuffer.give()

        # Executable
        @executable.on 'info-action', (obj) =>
            log 'Executable', '=> info-action'
            @panel.infoAction obj

        @executable.on 'goals-action', (obj) =>
            log 'Executable', '=> goals-action'
            @textBuffer.setGoals obj.goals

        @executable.on 'give-action', (obj) =>
            log 'Executable', '=> give-action'
            @textBuffer.giveHandler obj.goalIndex


module.exports = Core
