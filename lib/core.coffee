{EventEmitter} = require 'events'
Q = require 'Q'
{log, warn, error} = require './logger'

# Components
Executable  = require './executable'
PanelModel  = require './panel/model'
PanelView_  = require './panel/view_'
TextBuffer  = require './text-buffer'
InputMethod = require './input-method'

class Core extends EventEmitter

    @loaded: false
    panels: []
    constructor: (@editor) ->

        # initialize all components
        @executable     = new Executable    @
        @panelModel     = new PanelModel    @
        @textBuffer     = new TextBuffer    @
        @inputMethod    = new InputMethod   @

        # initialize informations about this editor
        @filePath = @editor.getPath()

        log 'Core', 'initialized:', @filePath


        #############
        #   Views   #
        #############

        # register
        atom.views.addViewProvider
            modelConstructor: PanelModel
            viewConstructor: PanelView_

        # instantiate
        @panel_ = atom.workspace.addBottomPanel
            item: atom.views.getView @panelModel
            visible: false
            className: 'agda-panel'




        #####################
        #   Editor Events   #
        #####################

        @on 'activate', =>
            log 'Core', 'activated:', @filePath
            @panel_.show()
        @on 'deactivate', =>
            log 'Core', 'deactivated:', @filePath
            @panel_.hide()
        @on 'destroy', =>
            log 'Core', 'destroyed:', @filePath
            @quit()


        #########################
        #   Components Events   #
        #########################

        # Executable
        @executable.on 'info-action', (obj) =>
            log 'Executable', '=> info-action'
            content = obj.content
            switch obj.type
                when '*All Goals*'
                    if obj.content.length > 0
                        @panelModel.set 'Goals', content, 'info'
                    else
                        @panelModel.set 'No Goals', [], 'success'
                when '*Error*'
                    @panelModel.set 'Error', content, 'error'
                when '*Type-checking*'
                    @panelModel.set 'Type Checking', content
                when '*Current Goal*'
                    @panelModel.set 'Current Goal', content
                when '*Context*'
                    @panelModel.set 'Context', content
                when '*Goal type etc.*'
                    @panelModel.set 'Goal Type and Context', content
                when '*Normal Form*'
                    @panelModel.set 'Normal Form', content
                when '*Intro*'
                    @panelModel.set 'Intro', ['No introduction forms found']
                when '*Auto*'
                    @panelModel.set 'Auto', ['No solution found']

        @executable.on 'goals-action', (obj) =>
            log 'Executable', '=> goals-action'
            @textBuffer.goalsAction obj.goals

        @executable.on 'give-action', (obj) =>
            log 'Executable', '=> give-action'
            @textBuffer.giveAction obj.goalIndex, obj.content, obj.paran

        @executable.on 'make-case-action', (obj) =>
            log 'Executable', '=> make-case-action'
            @textBuffer.makeCaseAction obj.content
                .then => @load()

        @executable.on 'goto', (obj) =>
            log 'Executable', '=> goto'
            @textBuffer.goto obj.filepath, obj.position

        @executable.on 'highlight-load-and-delete-action', (obj) =>
            log 'Executable', '=> highlight-load-and-delete-action'
            @textBuffer.highlightLoadAndDelete obj.filepath

    ################
    #   Commands   #
    ################

    load: ->
        log 'Command', 'load'
        @executable.load().then (process) =>
            @panel_.show()
            @panelModel.title = 'Loading'
            @loaded = true

    quit: -> if @loaded
        log 'Command', 'warn'
        @loaded = false
        @executable.quit()
        @panel_.hide()
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
        @panelModel.query().then (expr) =>
            @executable.normalize expr

    inputSymbol: ->
        log 'Command', 'input-symbol'
        unless @loaded
            @panel_.show()
            @panelModel.set 'Input Method only, Agda not loaded', [], 'warning'
        @inputMethod.activate()

module.exports = Core
