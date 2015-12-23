_ = require 'lodash'
{spawn, exec} = require 'child_process'
Promise = require 'bluebird'
{parsePath} = require './util'
Agda = require './parser/agda'
{InvalidExecutablePathError} = require './error'
Promise.longStackTraces()


class Executable

    # instance wired the agda-mode executable
    agdaProcessWired: false
    agdaProcess: null

    constructor: (@core) ->

    getLibraryPath: ->
        path = atom.config.get('agda-mode.libraryPath')
        path.unshift('.')
        return path.map((p) -> '\"' + parsePath p + '\"').join(', ')

    getProgramArgs: ->
        args = atom.config.get('agda-mode.programArgs')
        return _.compact(args.split(' '))

    # locate the path and see if it is truly Agda executable
    validateExecutablePath: (path) -> new Promise (resolve, reject) =>
        path = parsePath path
        try
            agdaProcess = spawn path, ['-V']
            agdaProcess.on 'error', (error) =>
                reject new InvalidExecutablePathError error, path
            agdaProcess.stdout.once 'data', (data) =>
                if /^Agda/.test data.toString()
                    atom.config.set 'agda-mode.executablePath', path
                    resolve path
                else
                    reject new InvalidExecutablePathError data.toString(), path
        catch error
            reject new InvalidExecutablePathError error, path

    # keep banging the user until we got the right path
    queryExecutablePathUntilSuccess: (path) ->
        @core.panel.setContent "Agda executable not found: \"#{path}\"", [], 'warning', 'path of executable here'
        @core.panel.query(false) # disable input method
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

    # get executable path from the settings
    # else by the commend which
    # else query the user until success
    getExecutablePath: ->
        @getPathFromSettings()                                              #1
            .catch (error) => @getPathByWhich()                             #2
            .catch (error) => @queryExecutablePathUntilSuccess error.path   #3

    # get executable path from settings and validate it
    getPathFromSettings: ->
        path = atom.config.get 'agda-mode.executablePath'
        @validateExecutablePath path

    # get executable path by the command "which"
    getPathByWhich: -> new Promise (resolve, reject) =>
        programName = atom.config.get('agda-mode.programName')
        exec "which #{programName}", (error, stdout, stderr) =>
            if error
                reject new InvalidExecutablePathError error, programName
            else
                resolve @validateExecutablePath stdout

    wireAgdaProcess: -> new Promise (resolve, reject) =>
        if @agdaProcessWired
            resolve @agdaProcess
        else
            @getExecutablePath().then (path) =>

                # Agda program arguments
                args = @getProgramArgs()
                args.unshift '--interaction'
                agdaProcess = spawn path, args

                # catch other forms of errors
                agdaProcess.on 'error', (error) =>
                    reject error

                agdaProcess.stdout.once 'data', =>
                    @agdaProcessWired = true
                    @agdaProcess = agdaProcess
                    resolve agdaProcess

                agdaProcess.stdout
                    .pipe new Agda.Rectify
                    .pipe new Agda.ParseSExpr
                    .pipe new Agda.ParseCommand @core

            .catch (error) =>
                throw InvalidExecutablePathError "Failed miserably, please report this issue."

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
        @wireAgdaProcess().then (agdaProcess) =>
            filepath = @core.getPath()
            highlightingMethod = atom.config.get 'agda-mode.highlightingMethod'
            command = "IOTCM \"#{filepath}\" #{highlightingLevel} #{highlightingMethod} ( #{interaction} )\n"
            agdaProcess.stdin.write command
            return agdaProcess

    load: =>
        # force save before load, since we are sending filepath but content
        @core.textBuffer.saveBuffer()
        @sendCommand "NonInteractive", "Cmd_load \"#{@core.getPath()}\" [#{@getLibraryPath()}]"

    quit: =>
        @agdaProcess.kill()
        @agdaProcessWired = false

    info: =>
        @getExecutablePath().then (path) =>
            child = exec "#{path} -V", (error, stdout, stderr) =>
                if error
                    @core.panel.setContent "Error", "#{error}", 'error'
                else
                    result = stdout.toString().match /^Agda version (.*)\n$/
                    args = @getProgramArgs()
                    args.unshift '--interaction'
                    if result
                        @core.panel.setContent "Info", [
                            "Agda version: #{result[1]}"
                            "Agda executable path: #{path}"
                            "Agda executable arguments: #{args.join(' ')}"
                        ]
                    else
                        @core.panel.setContent "Error", ["unable to parse agda version message #{stdout.toString()}"], 'error'

    compile: =>
        backend = atom.config.get 'agda-mode.backend'
        @sendCommand "NonInteractive", "Cmd_compile #{backend} \"#{@core.getPath()}\" [#{@getLibraryPath()}]"
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
