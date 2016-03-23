Promise = require 'bluebird'
_ = require 'lodash'
{OutOfGoalError, EmptyGoalError, QueryCancelledError} = require './error'

class Command
    # promise
    promise: null
    resolve: null
    reject: null

    constructor: ->
        @promise = new Promise (resolve, reject) =>
            @resolve = resolve
            @reject = reject

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

    commandQueue: []
    maintainCommandQueue: (response) ->
        if @commandQueue.length isnt 0
            command = @commandQueue[0]
            if response is 'agda2-goals-action'
                @commandQueue.shift()
                command.resolve()
    emptyCommandQueue: ->
        @commandQueue.forEach (command) ->
            command.reject()
        @commandQueue = []

    # pushes a new Command into the queue and returns its promise
    newCommand: ->
        command = new Command
        @commandQueue.push(command)
        return command.promise


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


    ##################
    #   Checkpoint   #
    ##################

    commandCheckpoint: null
    commandStart: ->
        # lock
        unless @commandCheckpoint
            # start history transaction for undo/redo
            @commandCheckpoint = @core.editor.createCheckpoint()
            # enable visual effects
            @panel.isPending = true
    commandEnd: ->
        # unlock
        if @commandCheckpoint
            # group history transaction for undo/redo
            @core.editor.groupChangesSinceCheckpoint(@commandCheckpoint)
            @commandCheckpoint = null
            # disable visual effects
            @panel.isPending = false

    ################
    #   Commands   #
    ################

    load: ->
        @core.commander.commandStart()
        @atomPanel.show()
        @highlight.destroy()
        @process.load()
            .then =>        @loaded = true
            .finally =>     @core.commander.commandEnd()
            .catch (e) ->

    quit: -> if @loaded
        @loaded = false
        @atomPanel.hide()
        @highlight.destroy()
        @textBuffer.removeGoals()
        @process.quit()

    restart: ->
        @quit()
        @load()

    compile: ->
        @process.compile()

    toggleDisplayOfImplicitArguments: ->
        @process.toggleDisplayOfImplicitArguments()
            .catch ->


    info: ->
        @process.info()

    solveConstraints: ->
        @core.commander.commandStart()
        @process.solveConstraints()
            .catch ->

    showConstraints: ->
        @process.showConstraints()
            .catch ->

    showGoals: ->
        @process.showGoals()
            .catch ->

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
                @process.whyInScope(expr, goal)
                    .catch ->
                @textBuffer.focus()
            , =>
                # global command
                @process.whyInScope(expr)
                    .catch ->
                @textBuffer.focus()

    inferType: (normalization) ->
        @panel.setContent "Infer type #{toDescription normalization}", [], 'value', 'expression to infer:'
        @textBuffer.getCurrentGoal().done (goal) =>
            # goal-specific
            if goal.isEmpty()
                @panel.query().then (expr) =>
                    @process.inferType(normalization, expr, goal)
                        .catch ->
            else
                @process.inferType(normalization, goal.getContent(), goal)
                    .catch ->
        , =>
            # global command
            @panel.query().then (expr) =>
                @process.inferType(normalization, expr)
                    .catch ->

    moduleContents: (normalization) ->
        @panel.setContent "Module contents #{toDescription normalization}", [], 'plain-text', 'module name:'
        @panel.query().then (expr) =>
            @textBuffer.getCurrentGoal().done (goal) =>
                # goal-specific
                @process.moduleContents(normalization, expr, goal)
                    .catch ->
                @textBuffer.focus()
            , =>
                # global command
                @process.moduleContents(normalization, expr)
                    .catch ->
                @textBuffer.focus()

    computeNormalForm: ->
        @panel.setContent "Compute normal form", [], 'value', 'expression to normalize:'
        @panel.query()
            .then (expr) =>
                @textBuffer.getCurrentGoal().done (goal) =>
                    # goal-specific
                    @process.computeNormalForm(expr, goal)
                        .catch ->
                    @textBuffer.focus()
                , =>
                    # global command
                    @process.computeNormalForm(expr)
                        .catch ->
                    @textBuffer.focus()

    computeNormalFormIgnoreAbstract: ->
        @panel.setContent 'Compute normal form (ignoring abstract)', [], 'value', 'expression to normalize:'
        @panel.query().then (expr) =>
            @textBuffer.getCurrentGoal().done (goal) =>
                # goal-specific
                @process.computeNormalFormIgnoreAbstract(expr, goal)
                    .catch ->
                @textBuffer.focus()
            , =>
                # global command
                @process.computeNormalFormIgnoreAbstract(expr)
                    .catch ->
                @textBuffer.focus()

    give: ->
        @core.commander.commandStart()
        @textBuffer.getCurrentGoal()
            .then @textBuffer.checkGoalContent
                title: "Give"
                placeholder: "expression to give:"
                error: "Nothing to give"
            .then @process.give
            .finally => @core.commander.commandEnd()
            .catch ->

    refine: ->
        @core.commander.commandStart()
        @textBuffer.getCurrentGoal()
            .then @process.refine
            .finally => @core.commander.commandEnd()
            .catch ->
    auto: ->
        @core.commander.commandStart()
        @textBuffer.getCurrentGoal()
            .then @process.auto
            .finally => @core.commander.commandEnd()
            .catch ->

    case: ->
        @core.commander.commandStart()
        @textBuffer.getCurrentGoal()
            .then @textBuffer.checkGoalContent
                title: "Case"
                placeholder: "expression to case:"
                error: "Nothing to case"
            .then @process.case
            .catch ->

    goalType: (normalization) ->
        @textBuffer.getCurrentGoal()
            .then @process.goalType(normalization)
            .catch ->

    context: (normalization) ->
        @textBuffer.getCurrentGoal()
            .then @process.context(normalization)
            .catch ->

    goalTypeAndContext: (normalization) ->
        @textBuffer.getCurrentGoal()
            .then @process.goalTypeAndContext(normalization)
            .catch ->

    goalTypeAndInferredType: (normalization) ->
        @textBuffer.getCurrentGoal()
            .then @process.goalTypeAndInferredType(normalization)
            .catch ->

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
