{EventEmitter} = require 'events'
Q = require 'Q'
{log, warn, error} = require './logger'

# Components
Executable  = require './executable'
Panel       = require './panel'
TextBuffer  = require './text-buffer'
InputMethod = require './input-method'

class Core extends EventEmitter

    @loaded = false

    constructor: (@editor) ->

        # initialize all components
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
                .then => @load()

    ################
    #   Commands   #
    ################

    load: ->
        log 'Command', 'load'
        @executable.load().then (process) =>
            @panel.show()
            @loaded = true

    quit: -> if @loaded
        log 'Command', 'quit'
        @loaded = false
        @executable.quit()
        @panel.hide()
        @textBuffer.removeGoals()

    restart: -> if @loaded
        log 'Command', 'restart'
        @quit()
        @load()

    nextGoal: -> if @loaded
        log 'Command', 'next-goal'
        @textBuffer.nextGoal()

    previousGoal: -> if @loaded
        log 'Command', 'previous-goal'
        @textBuffer.previousGoal()

    give: -> if @loaded
        log 'Command', 'give'
        @textBuffer.give()

    goalType: -> if @loaded
        log 'Command', 'goal-type'
        @textBuffer.goalType()

    context: -> if @loaded
        log 'Command', 'context'
        @textBuffer.context()

    goalTypeAndContext: -> if @loaded
        log 'Command', 'goal-type-and-context'
        @textBuffer.goalTypeAndContext()

    goalTypeAndInferredType: -> if @loaded
        log 'Command', 'goal-type-inferred-type'
        @textBuffer.goalTypeAndInferredType()

    refine: -> if @loaded
        log 'Command', 'refine'
        @textBuffer.refine()

    case: -> if @loaded
        log 'Command', 'case'
        @textBuffer.case()

    auto: -> if @loaded
        log 'Command', 'auto'
        @textBuffer.auto()

    normalize: -> if @loaded
        log 'Command', 'normalize'
        @panel.queryExpression().promise.then (expr) =>
            @executable.normalize expr

    inputSymbol: -> if @loaded
        log 'Command', 'input-symbol'
        @inputMethod.activate()

module.exports = Core
