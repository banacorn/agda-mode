Q = require 'q'
Q.longStackSupport = true
_ = require 'lodash'
{$} = require 'atom-space-pen-views'
{log, warn, error} = require './logger'
{Range} = require 'atom'


# Components
Executable  = require './executable'
PanelModel  = require './panel/model'
PanelView   = require './panel/view'
TextBuffer  = require './text-buffer'
InputMethod = require './input-method'
Highlight   = require './highlight'
Config      = require './config'
Handler     = require './handler'

class Core

    @loaded: false
    panels: []
    constructor: (@editor) ->

        # helper methods on @editor
        @editor.fromIndex = (ind) => @editor.getBuffer().positionForCharacterIndex ind
        @editor.toIndex   = (pos) => @editor.getBuffer().characterIndexForPosition pos
        @editor.translate = (pos, n) => @editor.fromIndex((@editor.toIndex pos) + n)
        @editor.fromCIRange = (range) =>
            start = @editor.fromIndex range.start
            end   = @editor.fromIndex range.end
            new Range start, end


        # initialize all components
        @executable     = new Executable    @
        @panelModel     = new PanelModel    @
        @textBuffer     = new TextBuffer    @
        @inputMethod    = new InputMethod   @
        @config         = new Config
        @highlight      = new Highlight     @
        @handler        = new Handler       @
        # initialize informations about this editor
        @filepath = @editor.getPath()

        log 'Core', 'initialized:', @filepath


        #############
        #   Views   #
        #############

        # register panel view, fuck Atom's everchanging always outdated documentation
        atom.views.addViewProvider PanelModel, (model) =>
            view = new PanelView
            view.setModel model
            return $(view).get(0)

        # instantiate
        @panel = atom.workspace.addBottomPanel
            item: atom.views.getView @panelModel
            visible: false
            className: 'agda-panel'


    #####################
    #   Editor Events   #
    #####################

    activate: ->
        log 'Core', 'activated:', @filepath
        @panel.show()
    deactivate: ->
        log 'Core', 'deactivated:', @filepath
        @panel.hide()
    destroy: ->
        log 'Core', 'destroyed:', @filepath
        @quit()



    ################
    #   Commands   #
    ################

    load: ->
        log 'Command', 'load'
        @panel.show()
        @highlight.destroyAllMarker()
        @executable.load().then (process) =>
            @panelModel.set 'Loading'
            @loaded = true

    quit: -> if @loaded
        log 'Command', 'warn'
        @loaded = false
        @executable.quit()
        @panel.hide()
        @textBuffer.removeGoals()

    restart: -> if @loaded
        log 'Command', 'restart'
        @quit()
        @load()

    compile: -> if @loaded
        log 'Command', 'compile'
        @executable.compile()

    toggleDisplayOfImplicitArguments: ->  if @loaded
        log 'Command', 'toggle display of implicit arguments'
        @executable.toggleDisplayOfImplicitArguments()

    showConstraints: ->  if @loaded
        log 'Command', 'show constraints'
        @executable.showConstraints()

    showGoals: ->  if @loaded
        log 'Command', 'show goals'
        @executable.showGoals()

    nextGoal: -> if @loaded
        log 'Command', 'next-goal'
        @textBuffer.nextGoal()

    previousGoal: -> if @loaded
        log 'Command', 'previous-goal'
        @textBuffer.previousGoal()

    inferType: -> if @loaded
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

    inferTypeNoNormalization: -> if @loaded
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

    inferTypeFullNormalization: -> if @loaded
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

    moduleContents: -> if @loaded
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

    moduleContentsNoNormalization: -> if @loaded
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

    moduleContentsFullNormalization: -> if @loaded
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

    computeNormalForm: -> if @loaded
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

    computeNormalFormIgnoreAbstract: -> if @loaded
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

    give: -> if @loaded
        log 'Command', 'give'
        @textBuffer.give()

    refine: -> if @loaded
        log 'Command', 'refine'
        @textBuffer.refine()

    auto: -> if @loaded
        log 'Command', 'auto'
        @textBuffer.auto()

    case: -> if @loaded
        log 'Command', 'case'
        @textBuffer.case()

    goalType: -> if @loaded
        log 'Command', 'goal-type'
        @textBuffer.goalType "Simplified"

    goalTypeNoNormalization: -> if @loaded
        log 'Command', 'goal-type (no normalization)'
        @textBuffer.goalType "Instantiated"

    goalTypeFullNormalization: -> if @loaded
        log 'Command', 'goal-type (full normalization)'
        @textBuffer.goalType "Normalised"

    context: -> if @loaded
        log 'Command', 'context'
        @textBuffer.context "Simplified"

    contextNoNormalization: -> if @loaded
        log 'Command', 'context'
        @textBuffer.context "Instantiated"

    contextFullNormalization: -> if @loaded
        log 'Command', 'context (without normalizing)'
        @textBuffer.context "Normalised"

    goalTypeAndContext: -> if @loaded
        log 'Command', 'goal-type-and-context'
        @textBuffer.goalTypeAndContext "Simplified"

    goalTypeAndContextNoNormalization: -> if @loaded
        log 'Command', 'goal-type-and-context'
        @textBuffer.goalTypeAndContext "Instantiated"

    goalTypeAndContextFullNormalization: -> if @loaded
        log 'Command', 'goal-type-and-context (without normalizing)'
        @textBuffer.goalTypeAndContext "Normalised"

    goalTypeAndInferredType: -> if @loaded
        log 'Command', 'goal-type-inferred-type'
        @textBuffer.goalTypeAndInferredType "Simplified"

    goalTypeAndInferredTypeNoNormalization: -> if @loaded
        log 'Command', 'goal-type-inferred-type'
        @textBuffer.goalTypeAndInferredType "Instantiated"

    goalTypeAndInferredTypeFullNormalization: -> if @loaded
        log 'Command', 'goal-type-inferred-type-without-normalizing'
        @textBuffer.goalTypeAndInferredType "Normalised"

    inputSymbol: ->
        log 'Command', 'input-symbol'
        unless @loaded
            @panel.show()
            @panelModel.set 'Input Method only, Agda not loaded', [], 'warning'
        @inputMethod.activate()

module.exports = Core
