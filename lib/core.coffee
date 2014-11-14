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




        #########################
        #   Components Events   #
        #########################



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

        @commander.on 'goal-type', =>
            log 'Commander', 'goal-type'
            @textBuffer.goalType()

        @commander.on 'context', =>
            log 'Commander', 'context'
            @textBuffer.context()

        @commander.on 'goal-type-and-context', =>
            log 'Commander', 'goal-type-and-context'
            @textBuffer.goalTypeAndContext()

        @commander.on 'goal-type-and-inferred-type', =>
            log 'Commander', 'goal-type-inferred-type'
            @textBuffer.goalTypeAndInferredType()

        @commander.on 'refine', =>
            log 'Commander', 'refine'
            @textBuffer.refine()

        @commander.on 'case', =>
            log 'Commander', 'case'
            @textBuffer.case()

        # Executable
        @executable.on 'info-action', (obj) =>
            log 'Executable', '=> info-action'
            @panel.infoAction obj

        @executable.on 'goals-action', (obj) =>
            log 'Executable', '=> goals-action'
            @textBuffer.goalsAction obj.goals

        @executable.on 'give-action', (obj) =>
            log 'Executable', '=> give-action'
            @textBuffer.giveAction obj.goalIndex, obj.content

        @executable.on 'make-case-action', (obj) =>
            log 'Executable', '=> make-case-action'
            @textBuffer.makeCaseAction obj.content
                .then => @commander.load()

module.exports = Core
