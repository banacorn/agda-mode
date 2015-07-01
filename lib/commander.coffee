Core = require './core'
{log, warn, error} = require './logger'
{OutOfGoalError} = require './error'

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
        @panel          = @core.panel
        @highlight      = @core.highlight
        @executable     = @core.executable
        @panelModel     = @core.panelModel
        @textBuffer     = @core.textBuffer
        @inputMethod    = @core.inputMethod
        @config         = @core.config
        @highlight      = @core.highlight
        @handler        = @core.handler
        @filepath       = @core.filepath
    command: (raw) ->
        {command, method, option} = @parse raw
        log "Commander", "loaded: #{@loaded}\n command: #{command}\n normalization: #{option}"

        switch command
            when 'load'
                @load()
            else
                if @loaded
                    @[method](option)
                        .catch OutOfGoalError, @textBuffer.warnOutOfGoal
                        .catch (e) -> console.log

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
        @panel.show()
        @highlight.destroyAllMarker()
        @executable.load().then (process) =>
            @panelModel.set 'Loading'
            @loaded = true

    quit: ->
        @loaded = false
        @executable.quit()
        @panel.hide()
        @textBuffer.removeGoals()

    restart: ->
        @quit()
        @load()

    compile: ->
        @executable.compile()

    toggleDisplayOfImplicitArguments: ->
        @executable.toggleDisplayOfImplicitArguments()

    showConstraints: ->
        @executable.showConstraints()

    showGoals: ->
        @executable.showGoals()

    nextGoal: ->
        @textBuffer.nextGoal()

    previousGoal: ->
        @textBuffer.previousGoal()

    inferType: (normalization) ->
        @panelModel.set "Infer type #{toDescription normalization}", [], 'info'
        @panelModel.placeholder = 'expression to infer:'
        @panelModel.query().then (expr) =>
            @textBuffer.getCurrentGoal().done (goal) =>
                # goal-specific
                @executable.inferType normalization, expr, goal
                @textBuffer.focus()
            , =>
                # global command
                @executable.inferType normalization, expr
                @textBuffer.focus()

    moduleContents: (normalization) ->
        @panelModel.set "Module contents #{toDescription normalization}", [], 'info'
        @panelModel.placeholder = 'module name:'
        @panelModel.query().then (expr) =>
            @textBuffer.getCurrentGoal().done (goal) =>
                # goal-specific
                @executable.moduleContents normalization, expr, goal
                @textBuffer.focus()
            , =>
                # global command
                @executable.moduleContents normalization, expr
                @textBuffer.focus()

    computeNormalForm: (normalization) ->
        @panelModel.set "Compute normal form #{toDescription normalization}", [], 'info'
        @panelModel.placeholder = 'expression to normalize:'
        @panelModel.query().then (expr) =>
            @textBuffer.getCurrentGoal().done (goal) =>
                # goal-specific
                @executable.computeNormalForm expr, goal
                @textBuffer.focus()
            , =>
                # global command
                @executable.computeNormalForm expr
                @textBuffer.focus()

    computeNormalFormIgnoreAbstract: ->
        @panelModel.set 'Compute normal form (ignoring abstract)', [], 'info'
        @panelModel.placeholder = 'expression to normalize:'
        @panelModel.query().then (expr) =>
            @textBuffer.getCurrentGoal().done (goal) =>
                # goal-specific
                @executable.computeNormalFormIgnoreAbstract expr, goal
                @textBuffer.focus()
            , =>
                # global command
                @executable.computeNormalFormIgnoreAbstract expr
                @textBuffer.focus()

    give: -> @textBuffer.getCurrentGoal().then (goal) =>
        @executable.give goal

    refine: -> @textBuffer.getCurrentGoal().then (goal) =>
        @executable.refine goal

    auto: -> @textBuffer.getCurrentGoal().then (goal) =>
        @executable.auto goal

    case: -> @textBuffer.getCurrentGoal().then (goal) =>
        @executable.case goal

    goalType: (normalization) -> @textBuffer.getCurrentGoal().then (goal) =>
            @executable.goalType normalization, goal

    context: (normalization) -> @textBuffer.getCurrentGoal().then (goal) =>
            @executable.context normalization, goal

    goalTypeAndContext: (normalization) -> @textBuffer.getCurrentGoal().then (goal) =>
            @executable.goalTypeAndContext normalization, goal

    goalTypeAndInferredType: (normalization) -> @textBuffer.getCurrentGoal().then (goal) =>
            # @textBuffer.warnCurrentGoalIfEmpty goal, 'Nothing to infer'
            @executable.goalTypeAndInferredType normalization, goal

    inputSymbol: ->
        unless @loaded
            @panel.show()
            @panelModel.set 'Input Method only, Agda not loaded', [], 'warning'
        @inputMethod.activate()

module.exports = Commander
