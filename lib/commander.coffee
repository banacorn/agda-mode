Command = require './command'
Promise = require 'bluebird'
_ = require 'lodash'
{OutOfGoalError, EmptyGoalError, QueryCancelledError} = require './error'

toCamalCase = (str) ->
    str.split('-')
        .map (str, i) =>
            if i is 0
                str
            else
                str.charAt(0).toUpperCase() + str.slice(1)
        .join('')
toDescription = (normalization) ->
    switch normalization
        when 'Simplified' then ""
        when 'Instantiated' then "(no normalization)"
        when 'Normalised' then "(full normalization)"

class Commander
    loaded: false
    constructor: (@core) ->
        @highlight      = @core.highlight
        @process        = @core.process
        @panel          = @core.panel
        @atomPanel      = @core.atomPanel
        @textBuffer     = @core.textBuffer
        @inputMethod    = @core.inputMethod if atom.config.get('agda-mode.inputMethod')
        @highlight      = @core.highlight
        @handler        = @core.handler

    command: (raw) ->
        {command, method, option} = @parse raw
        # some commands can only be executed after "loaded"
        exception = ['load', 'input-symbol']
        if @loaded or _.contains exception, command
            @core.commandQueue.push(new Command command)
            Promise.resolve @[method](option)
                .catch OutOfGoalError, @textBuffer.warnOutOfGoal
                .catch EmptyGoalError, @textBuffer.warnEmptyGoal
                .catch QueryCancelledError, => console.error 'query cancelled'
                .catch (e) -> throw e

    parse: (raw) ->
        result = raw.match(/^agda-mode:((?:\w|\-)*)(?:\[(\w*)\])?/)
        return {
            command: result[1]
            method: toCamalCase result[1]
            option: result[2]
        }

    ################
    #   Commands   #
    ################

    load: ->
        @atomPanel.show()
        @highlight.destroy()
        @process.load().then (process) =>
            @panel.title = 'Loading'
            @loaded = true

    quit: -> if @loaded
        @loaded = false
        @process.quit()
        @atomPanel.hide()
        @highlight.destroy()
        @textBuffer.removeGoals()

    restart: ->
        @quit()
        @load()

    compile: ->
        @process.compile()

    toggleDisplayOfImplicitArguments: ->
        @process.toggleDisplayOfImplicitArguments()

    info: ->
        @process.info()

    solveConstraints: ->
        @process.solveConstraints()

    showConstraints: ->
        @process.showConstraints()

    showGoals: ->
        @process.showGoals()

    nextGoal: ->
        @textBuffer.nextGoal()

    previousGoal: ->
        @textBuffer.previousGoal()

    whyInScope: ->
        @panel.setContent "Scope info", [], 'plain-text', 'name:'
        @panel.queryMode = true
        @panel.query().then (expr) =>
            @textBuffer.getCurrentGoal().done (goal) =>
                # goal-specific
                @process.whyInScope expr, goal
                @textBuffer.focus()
            , =>
                # global command
                @process.whyInScope expr
                @textBuffer.focus()

    inferType: (normalization) ->
        @panel.setContent "Infer type #{toDescription normalization}", [], 'value', 'expression to infer:'
        @textBuffer.getCurrentGoal().done (goal) =>
            # goal-specific
            if goal.isEmpty()
                @panel.query().then (expr) =>
                    @process.inferType normalization, expr, goal
            else
                @process.inferType normalization, goal.getContent(), goal
        , =>
            # global command
            @panel.query().then (expr) =>
                @process.inferType normalization, expr

    moduleContents: (normalization) ->
        @panel.setContent "Module contents #{toDescription normalization}", [], 'plain-text', 'module name:'
        @panel.query().then (expr) =>
            @textBuffer.getCurrentGoal().done (goal) =>
                # goal-specific
                @process.moduleContents normalization, expr, goal
                @textBuffer.focus()
            , =>
                # global command
                @process.moduleContents normalization, expr
                @textBuffer.focus()

    computeNormalForm: ->
        @panel.setContent "Compute normal form", [], 'value', 'expression to normalize:'
        @panel.query()
            .then (expr) =>
                @textBuffer.getCurrentGoal().done (goal) =>
                    # goal-specific
                    @process.computeNormalForm expr, goal
                    @textBuffer.focus()
                , =>
                    # global command
                    @process.computeNormalForm expr
                    @textBuffer.focus()

    computeNormalFormIgnoreAbstract: ->
        @panel.setContent 'Compute normal form (ignoring abstract)', [], 'value', 'expression to normalize:'
        @panel.query().then (expr) =>
            @textBuffer.getCurrentGoal().done (goal) =>
                # goal-specific
                @process.computeNormalFormIgnoreAbstract expr, goal
                @textBuffer.focus()
            , =>
                # global command
                @process.computeNormalFormIgnoreAbstract expr
                @textBuffer.focus()

    give: ->
        @textBuffer.getCurrentGoal()
            .then @textBuffer.checkGoalContent
                title: "Give"
                placeholder: "expression to give:"
                error: "Nothing to give"
            .then @process.give

    refine: ->
        @textBuffer.getCurrentGoal()
            .then @process.refine

    auto: ->
        @textBuffer.getCurrentGoal()
            .then @process.auto

    case: ->
        @textBuffer.getCurrentGoal()
            .then @textBuffer.checkGoalContent
                title: "Case"
                placeholder: "expression to case:"
                error: "Nothing to case"
            .then @process.case

    goalType: (normalization) ->
        @textBuffer.getCurrentGoal()
            .then @process.goalType normalization

    context: (normalization) ->
        @textBuffer.getCurrentGoal()
            .then @process.context normalization

    goalTypeAndContext: (normalization) ->
        @textBuffer.getCurrentGoal()
            .then @process.goalTypeAndContext normalization

    goalTypeAndInferredType: (normalization) ->
        @textBuffer.getCurrentGoal()
            .then @process.goalTypeAndInferredType normalization

    inputSymbol: ->
        # activate if input method enabled, else insert '\\'
        if atom.config.get('agda-mode.inputMethod')
            unless @loaded
                @atomPanel.show()
                @panel.setContent 'Input Method only, Agda not loaded', [], 'warning'
            @inputMethod.activate()
        else
            @core.editor.insertText '\\'

module.exports = Commander
