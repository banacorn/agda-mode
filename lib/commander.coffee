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

    # commandQueue: []
    # maintainCommandQueue: (response) ->
    #     if @commandQueue.length isnt 0
    #         command = @commandQueue[0]
    #         if response is 'agda2-goals-action'
    #             @commandQueue.shift()
    #             command.resolve()
    # emptyCommandQueue: ->
    #     @commandQueue.forEach (command) ->
    #         command.reject()
    #     @commandQueue = []

    # # pushes a new Command into the queue and returns its promise
    # newCommand: ->
    #     command = new Command
    #     @commandQueue.push(command)
    #     return command.promise


    constructor: (@core) ->
        @highlightManager      = @core.highlightManager
        @process        = @core.process
        @panel          = @core.panel
        @atomPanel      = @core.atomPanel
        @textBuffer     = @core.textBuffer
        @inputMethod    = @core.inputMethod if atom.config.get('agda-mode.inputMethod')

    command: (raw) ->
        {command, method, option} = @parse raw
        # some commands can only be executed after "loaded"
        exception = ['load', 'input-symbol']
        if @loaded or _.includes exception, command

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

    # commandCheckpoint: null
    # commandStart: ->
    #     # lock
    #     unless @commandCheckpoint
    #         # start history transaction for undo/redo
    #         @commandCheckpoint = @core.editor.createCheckpoint()
    #         # enable visual effects
    #         @panel.isPending = true
    # commandEnd: ->
    #     # unlock
    #     if @commandCheckpoint
    #         # group history transaction for undo/redo
    #         @core.editor.groupChangesSinceCheckpoint(@commandCheckpoint)
    #         @commandCheckpoint = null
    #         # disable visual effects
    #         @panel.isPending = false

    ################
    #   Commands   #
    ################

    load: ->
        # @core.commander.commandStart()
        @atomPanel.show()
        @process.load()
            .then =>    @loaded = true
            .catch (error) -> throw error

    quit: -> if @loaded
        @loaded = false
        @atomPanel.hide()
        @textBuffer.removeGoals()
        @process.quit()

    restart: ->
        @quit()
        @load()

    compile: ->
        @process.compile()

    toggleDisplayOfImplicitArguments: ->
        @process.toggleDisplayOfImplicitArguments()
            .catch (error) -> throw error

    info: ->
        @process.info()

    solveConstraints: ->
        # @core.commander.commandStart()
        @process.solveConstraints()
            .catch (error) -> throw error

    showConstraints: ->
        @process.showConstraints()
            .catch (error) -> throw error

    showGoals: ->
        @process.showGoals()
            .catch (error) -> throw error

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
                    .catch (error) -> throw error
                @textBuffer.focus()
            , =>
                # global command
                @process.whyInScope(expr)
                    .catch (error) -> throw error
                @textBuffer.focus()

    inferType: (normalization) ->
        @panel.setContent "Infer type #{toDescription normalization}", [], 'value', 'expression to infer:'
        @textBuffer.getCurrentGoal().done (goal) =>
            # goal-specific
            if goal.isEmpty()
                @panel.query().then (expr) =>
                    @process.inferType(normalization, expr, goal)
                        .catch (error) -> throw error
            else
                @process.inferType(normalization, goal.getContent(), goal)
                    .catch (error) -> throw error
        , =>
            # global command
            @panel.query().then (expr) =>
                @process.inferType(normalization, expr)
                    .catch (error) -> throw error

    moduleContents: (normalization) ->
        @panel.setContent "Module contents #{toDescription normalization}", [], 'plain-text', 'module name:'
        @panel.query().then (expr) =>
            @textBuffer.getCurrentGoal().done (goal) =>
                # goal-specific
                @process.moduleContents(normalization, expr, goal)
                    .catch (error) -> throw error
                @textBuffer.focus()
            , =>
                # global command
                @process.moduleContents(normalization, expr)
                    .catch (error) -> throw error
                @textBuffer.focus()

    computeNormalForm: ->
        @panel.setContent "Compute normal form", [], 'value', 'expression to normalize:'
        @panel.query()
            .then (expr) =>
                @textBuffer.getCurrentGoal().done (goal) =>
                    # goal-specific
                    @process.computeNormalForm(expr, goal)
                        .catch (error) -> throw error
                    @textBuffer.focus()
                , =>
                    # global command
                    @process.computeNormalForm(expr)
                        .catch (error) -> throw error
                    @textBuffer.focus()

    computeNormalFormIgnoreAbstract: ->
        @panel.setContent 'Compute normal form (ignoring abstract)', [], 'value', 'expression to normalize:'
        @panel.query().then (expr) =>
            @textBuffer.getCurrentGoal().done (goal) =>
                # goal-specific
                @process.computeNormalFormIgnoreAbstract(expr, goal)
                    .catch (error) -> throw error
                @textBuffer.focus()
            , =>
                # global command
                @process.computeNormalFormIgnoreAbstract(expr)
                    .catch (error) -> throw error
                @textBuffer.focus()

    give: ->
        @textBuffer.getCurrentGoal().then (goal) =>
                if goal.getContent()
                    return goal
                else
                    @panel.setContent("Give", [], "plain-text", "expression to give:")
                    @panel.query()
                        .then (expr) ->
                            goal.setContent(expr)
                            return goal
            .then @process.give
            .catch (error) ->
                console.log error


    refine: ->
        # @core.commander.commandStart()
        @textBuffer.getCurrentGoal()
            .then @process.refine
            # .finally => @core.commander.commandEnd()
            .catch (error) -> throw error

    auto: ->
        # @core.commander.commandStart()
        @textBuffer.getCurrentGoal()
            .then @process.auto
            # .finally => @core.commander.commandEnd()
            .catch (error) -> throw error

    case: ->
        @textBuffer.getCurrentGoal().then (goal) =>
                if goal.getContent()
                    return goal
                else
                    @panel.setContent("Case", [], "plain-text", "expression to case:")
                    @panel.query()
                        .then (expr) ->
                            goal.setContent(expr)
                            return goal
            .then @process.case
            .catch (error) ->
                console.log error


    goalType: (normalization) ->
        @textBuffer.getCurrentGoal()
            .then @process.goalType(normalization)
            .catch (error) -> throw error

    context: (normalization) ->
        @textBuffer.getCurrentGoal()
            .then @process.context(normalization)
            .catch (error) -> throw error

    goalTypeAndContext: (normalization) ->
        @textBuffer.getCurrentGoal()
            .then @process.goalTypeAndContext(normalization)
            .catch (error) -> throw error

    goalTypeAndInferredType: (normalization) ->
        @textBuffer.getCurrentGoal()
            .then @process.goalTypeAndInferredType(normalization)
            .catch (error) -> throw error

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
