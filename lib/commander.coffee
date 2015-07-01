Core = require './core'
{log, warn, error} = require './logger'

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
        log "Commander", "#{@loaded} #{command} #{method} #{option}"

        switch command
            when 'load'
                @load()
            else
                @[method](option) if @loaded

    parse: (raw) ->
        result = raw.match(/^agda-mode:((?:\w|\-)*)(?:\[(\w*)\])?/)
        return {
            command: result[1]
            method: result[1]
                        .split('-')
                        .map (str, i) =>
                            if i is 0
                                str
                            else
                                str.charAt(0).toUpperCase() + str.slice(1)
                        .join('')
            option: if result[2] then JSON.parse result[2] else null
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
        log 'Command', 'warn'
        @loaded = false
        @executable.quit()
        @panel.hide()
        @textBuffer.removeGoals()

    restart: ->
        log 'Command', 'restart'
        @quit()
        @load()

    compile: ->
        log 'Command', 'compile'
        @executable.compile()

    toggleDisplayOfImplicitArguments: ->
        log 'Command', 'toggle display of implicit arguments'
        @executable.toggleDisplayOfImplicitArguments()

    showConstraints: ->
        log 'Command', 'show constraints'
        @executable.showConstraints()

    showGoals: ->
        log 'Command', 'show goals'
        @executable.showGoals()

    nextGoal: ->
        log 'Command', 'next-goal'
        @textBuffer.nextGoal()

    previousGoal: ->
        log 'Command', 'previous-goal'
        @textBuffer.previousGoal()

    inferType: ->
        log 'Command', 'infer type'

        @panelModel.set 'Infer type', [], 'info'
        @panelModel.placeholder = 'expression to infer:'
        @panelModel.query().then (expr) =>
            @textBuffer.getCurrentGoal().done (goal) =>
                # goal-specific
                @executable.inferType "Simplified", expr, goal
                @textBuffer.focus()
            , =>
                # global command
                @executable.inferType "Simplified", expr
                @textBuffer.focus()

    inferTypeNoNormalization: ->
        log 'Command', 'infer type (no normalization)'

        @panelModel.set 'Infer type (no normalization)', [], 'info'
        @panelModel.placeholder = 'expression to infer:'
        @panelModel.query().then (expr) =>
            @textBuffer.getCurrentGoal().done (goal) =>
                # goal-specific
                @executable.inferType "Instantiated", expr, goal
                @textBuffer.focus()
            , =>
                # global command
                @executable.inferType "Instantiated", expr
                @textBuffer.focus()

    inferTypeFullNormalization: ->
        log 'Command', 'infer type (full normalization)'

        @panelModel.set 'Infer type (full normalization)', [], 'info'
        @panelModel.placeholder = 'expression to infer:'
        @panelModel.query().then (expr) =>
            @textBuffer.getCurrentGoal().done (goal) =>
                # goal-specific
                @executable.inferType "Normalised", expr, goal
                @textBuffer.focus()
            , =>
                # global command
                @executable.inferType "Normalised", expr
                @textBuffer.focus()

    moduleContents: ->
        log 'Command', 'module contents'

        @panelModel.set 'Module contents', [], 'info'
        @panelModel.placeholder = 'module name:'
        @panelModel.query().then (expr) =>
            @textBuffer.getCurrentGoal().done (goal) =>
                # goal-specific
                @executable.moduleContents "Simplified", expr, goal
                @textBuffer.focus()
            , =>
                # global command
                @executable.moduleContents "Simplified", expr
                @textBuffer.focus()

    moduleContentsNoNormalization: ->
        log 'Command', 'module contents (no normalization)'

        @panelModel.set 'Module contents (no normalization)', [], 'info'
        @panelModel.placeholder = 'module name:'
        @panelModel.query().then (expr) =>
            @textBuffer.getCurrentGoal().done (goal) =>
                # goal-specific
                @executable.moduleContents "Instantiated", expr, goal
                @textBuffer.focus()
            , =>
                # global command
                @executable.moduleContents "Instantiated", expr
                @textBuffer.focus()

    moduleContentsFullNormalization: ->
        log 'Command', 'module contents (full normalization)'

        @panelModel.set 'Module contents (full normalization)', [], 'info'
        @panelModel.placeholder = 'module name:'
        @panelModel.query().then (expr) =>
            @textBuffer.getCurrentGoal().done (goal) =>
                # goal-specific
                @executable.moduleContents "Normalised", expr, goal
                @textBuffer.focus()
            , =>
                # global command
                @executable.moduleContents "Normalised", expr
                @textBuffer.focus()

    computeNormalForm: ->
        log 'Command', 'normalize'
        @panelModel.set 'Compute normal form', [], 'info'
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
        log 'Command', 'normalize'
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

    give: ->
        log 'Command', 'give'
        @textBuffer.give()

    refine: ->
        log 'Command', 'refine'
        @textBuffer.refine()

    auto: ->
        log 'Command', 'auto'
        @textBuffer.auto()

    case: ->
        log 'Command', 'case'
        @textBuffer.case()

    goalType: ->
        log 'Command', 'goal-type'
        @textBuffer.goalType "Simplified"

    goalTypeNoNormalization: ->
        log 'Command', 'goal-type (no normalization)'
        @textBuffer.goalType "Instantiated"

    goalTypeFullNormalization: ->
        log 'Command', 'goal-type (full normalization)'
        @textBuffer.goalType "Normalised"

    context: ->
        log 'Command', 'context'
        @textBuffer.context "Simplified"

    contextNoNormalization: ->
        log 'Command', 'context'
        @textBuffer.context "Instantiated"

    contextFullNormalization: ->
        log 'Command', 'context (without normalizing)'
        @textBuffer.context "Normalised"

    goalTypeAndContext: ->
        log 'Command', 'goal-type-and-context'
        @textBuffer.goalTypeAndContext "Simplified"

    goalTypeAndContextNoNormalization: ->
        log 'Command', 'goal-type-and-context'
        @textBuffer.goalTypeAndContext "Instantiated"

    goalTypeAndContextFullNormalization: ->
        log 'Command', 'goal-type-and-context (without normalizing)'
        @textBuffer.goalTypeAndContext "Normalised"

    goalTypeAndInferredType: ->
        log 'Command', 'goal-type-inferred-type'
        @textBuffer.goalTypeAndInferredType "Simplified"

    goalTypeAndInferredTypeNoNormalization: ->
        log 'Command', 'goal-type-inferred-type'
        @textBuffer.goalTypeAndInferredType "Instantiated"

    goalTypeAndInferredTypeFullNormalization: ->
        log 'Command', 'goal-type-inferred-type-without-normalizing'
        @textBuffer.goalTypeAndInferredType "Normalised"

    inputSymbol: ->
        log 'Command', 'input-symbol'
        unless @loaded
            @panel.show()
            @panelModel.set 'Input Method only, Agda not loaded', [], 'warning'
        @inputMethod.activate()

module.exports = Commander
