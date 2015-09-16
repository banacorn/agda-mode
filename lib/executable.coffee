{spawn} = require 'child_process'
Promise = require 'bluebird'
{parsePath} = require './util'
Stream = require './executable/stream'
{InvalidExecutablePathError} = require './error'
Promise.longStackTraces()

class Executable

    # instance wired the agda-mode executable
    processWired: false
    process: null

    constructor: (@core) ->

    getLibraryPath: ->
        path = atom.config.get('agda-mode.libraryPath')
        path.unshift('.')
        return path.map((p) -> '\"' + p + '\"').join(', ')

    # locate the path and see if it is Agda executable
    validateExecutablePath: (path) -> new Promise (resolve, reject) =>
        path = parsePath path

        process = spawn path, ['-V']

        process.on 'error', (error) =>
            reject new InvalidExecutablePathError error

        process.stdout.once 'data', (data) =>
            if /^Agda/.test data.toString()
                resolve path
            else
                reject new InvalidExecutablePathError data.toString()

    # keep banging the user until we got the right path
    queryExecutablePathUntilSuccess: (path) ->
        @core.panel.setContent "Agda executable not found: \"#{path}\"", [], 'warning', 'path of executable here'
        @core.panel.query()
            .then (path) =>
                path = parsePath path
                @validateExecutablePath path
                    .then (path) => path
                    .catch InvalidExecutablePathError, => @queryExecutablePathUntilSuccess path
            .then (path) =>
                atom.config.set 'agda-mode.executablePath', path
                return path
            .catch InvalidExecutablePathError, =>
                @queryExecutablePathUntilSuccess path

    # get executable path from config, query the user if failed
    getExecutablePath: ->
        path = atom.config.get 'agda-mode.executablePath'
        @validateExecutablePath path
            .then (path) => path
            .catch InvalidExecutablePathError, => @queryExecutablePathUntilSuccess path

    getProcess: -> new Promise (resolve, reject) =>
        if @processWired
            resolve @process
        else
            @getExecutablePath().then (path) =>
                process = spawn path, ['--interaction']

                # catch other forms of errors
                process.on 'error', (error) =>
                    reject error

                process.stdout.once 'data', =>
                    @processWired = true
                    @process = process
                    resolve process

                process.stdout
                    .pipe new Stream.Rectify
                    .pipe new Stream.ParseSExpr
                    .pipe new Stream.ParseCommand @core
            .catch (e) -> console.error e

    ################
    #   COMMANDS   #
    ################
    #
    # data IOTCM = IOTCM FilePath HighlightingLevel HighlightingMethod (Interaction' range)
    # data HighlightingLevel = None | NonInteractive | Interactive
    # data HighlightingMethod = Direct | Indirect
    #
    # data Range a = Range [Interval' a]
    # data Interval a = Interval { iStart, iEnd :: !(Position' a) }
    # data Position a = Pn a !Int32 !Int32 !Int32
    #
    # ################

    buildRange: (goal) ->
        start       = goal.range.start
        startIndex  = @core.editor.toIndex start
        end         = goal.range.end
        endIndex    = @core.editor.toIndex end
        "( Range [Interval
            (Pn
                (Just (mkAbsolute \"#{@core.getPath()}\"))
                #{startIndex}
                #{start.row + 1}
                #{start.column + 1})
            (Pn
                (Just (mkAbsolute \"#{@core.getPath()}\"))
                #{endIndex}
                #{end.row + 1}
                #{end.column + 1})
            ])"

    sendCommand: (highlightingLevel, interaction) ->
        @getProcess().then (process) =>
            filepath = @core.getPath()
            highlightingMethod = atom.config.get 'agda-mode.highlightingMethod'
            command = "IOTCM \"#{filepath}\" #{highlightingLevel} #{highlightingMethod} ( #{interaction} )\n"
            process.stdin.write command
            return process

    load: =>
        # force save before load, since we are sending filepath but content
        @core.textBuffer.saveBuffer()
        @sendCommand "NonInteractive", "Cmd_load \"#{@core.getPath()}\" [#{@getLibraryPath()}]"

    quit: =>
        @process.kill()
        @processWired = false

    compile: =>
        @sendCommand "NonInteractive", "Cmd_compile MAlonzo \"#{@core.getPath()}\" [#{@getLibraryPath()}]"
    toggleDisplayOfImplicitArguments: =>
        @sendCommand "NonInteractive", "ToggleImplicitArgs"
    showConstraints: =>
        @sendCommand "NonInteractive", "Cmd_constraints"
    showGoals: =>
        @sendCommand "NonInteractive", "Cmd_metas"
    whyInScope: (expr, goal) =>
        if goal
            @sendCommand "NonInteractive", "Cmd_why_in_scope #{goal.index} noRange \"#{expr}\""
        else
            @sendCommand "None", "Cmd_why_in_scope_toplevel \"#{expr}\""

    inferType: (normalization, content, goal) =>
        if goal
            @sendCommand "NonInteractive", "Cmd_infer #{normalization} #{goal.index} noRange \"#{content}\""
        else
            @sendCommand "None", "Cmd_infer_toplevel #{normalization} \"#{content}\""
    moduleContents: (normalization, content, goal) =>
        if goal
            @sendCommand "NonInteractive", "Cmd_show_module_contents #{normalization} #{goal.index} noRange \"#{content}\""
        else
            @sendCommand "None", "Cmd_show_module_contents_toplevel #{normalization} \"#{content}\""
    computeNormalForm: (content, goal) =>
        if goal
            @sendCommand "NonInteractive", "Cmd_compute False #{goal.index} noRange \"#{content}\""
        else
            @sendCommand "None", "Cmd_compute_toplevel False \"#{content}\""
    computeNormalFormIgnoreAbstract: (content, goal) =>
        if goal
            @sendCommand "NonInteractive", "Cmd_compute True #{goal.index} noRange \"#{content}\""
        else
            @sendCommand "None", "Cmd_compute_toplevel True \"#{content}\""
    give: (goal) =>
        @sendCommand "NonInteractive", "Cmd_give #{goal.index} #{@buildRange goal} \"#{goal.getContent()}\""
    refine: (goal) =>
        @sendCommand "NonInteractive", "Cmd_refine_or_intro False #{goal.index} #{@buildRange goal} \"#{goal.getContent()}\""
    auto: (goal) =>
        @sendCommand "NonInteractive", "Cmd_auto #{goal.index} #{@buildRange goal} \"#{goal.getContent()}\""
    case: (goal) =>
        @sendCommand "NonInteractive", "Cmd_make_case #{goal.index} #{@buildRange goal} \"#{goal.getContent()}\""
    goalType: (normalization) => (goal) =>
        @sendCommand "NonInteractive", "Cmd_goal_type #{normalization} #{goal.index} noRange \"\""
    context: (normalization) => (goal) =>
        @sendCommand "NonInteractive", "Cmd_context #{normalization} #{goal.index} noRange \"\""
    goalTypeAndContext: (normalization) => (goal) =>
        @sendCommand "NonInteractive", "Cmd_goal_type_context #{normalization} #{goal.index} noRange \"\""
    goalTypeAndInferredType: (normalization) => (goal) =>
        @sendCommand "NonInteractive", "Cmd_goal_type_context_infer #{normalization} #{goal.index} noRange \"#{goal.getContent()}\""

module.exports = Executable
