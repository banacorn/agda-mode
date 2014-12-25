{EventEmitter} = require 'events'
Q = require 'Q'
{log, warn, error} = require './logger'

# Components
Commander   = require './commander'
Executable  = require './executable'
Panel       = require './panel'
TextBuffer  = require './text-buffer'
InputMethod = require './input-method'

class Core extends EventEmitter

    @loaded = false

    constructor: (@editor) ->

        # initialize all components
        @commander      = new Commander     @
        @executable     = new Executable    @
        @panel          = new Panel         @
        @textBuffer     = new TextBuffer    @
        @inputMethod    = new InputMethod   @

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
                @loaded = true

        @commander.on 'quit', => if @loaded
            log 'Commander', 'quit'
            @loaded = false
            @executable.quit()
            @panel.hide()
            @textBuffer.removeGoals()

        @commander.on 'restart', => if @loaded
            log 'Commander', 'restart'
            @commander.quit()
            @commander.load()

        @commander.on 'next-goal', => if @loaded
            log 'Commander', 'next-goal'
            @textBuffer.nextGoal()

        @commander.on 'previous-goal', => if @loaded
            log 'Commander', 'previous-goal'
            @textBuffer.previousGoal()

        @commander.on 'give', => if @loaded
            log 'Commander', 'give'
            @textBuffer.give()

        @commander.on 'goal-type', => if @loaded
            log 'Commander', 'goal-type'
            @textBuffer.goalType()

        @commander.on 'context', => if @loaded
            log 'Commander', 'context'
            @textBuffer.context()

        @commander.on 'goal-type-and-context', => if @loaded
            log 'Commander', 'goal-type-and-context'
            @textBuffer.goalTypeAndContext()

        @commander.on 'goal-type-and-inferred-type', => if @loaded
            log 'Commander', 'goal-type-inferred-type'
            @textBuffer.goalTypeAndInferredType()

        @commander.on 'refine', => if @loaded
            log 'Commander', 'refine'
            @textBuffer.refine()

        @commander.on 'case', => if @loaded
            log 'Commander', 'case'
            @textBuffer.case()

        @commander.on 'auto', => if @loaded
            log 'Commander', 'auto'
            @textBuffer.auto()

        @commander.on 'normalize', => if @loaded
            log 'Commander', 'normalize'
            @panel.queryExpression().promise.then (expr) =>
                @executable.normalize expr

        @commander.on 'input-method', => if @loaded
            log 'Commander', 'input-method'
            @inputMethod.activate()

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
