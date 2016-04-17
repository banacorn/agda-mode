_ = require 'lodash'
semver = require 'semver'
{spawn, exec} = require 'child_process'
Promise = require 'bluebird'
{parsePath} = require './util'
Agda = require './parser/agda'
{InvalidExecutablePathError, ProcExecError} = require './error'
Promise.longStackTraces()


class Process

    agdaProcessWired: false
    agdaProcess: null
    agdaVersion: null

    constructor: (@core) ->

    getLibraryPath: ->
        path = atom.config.get('agda-mode.libraryPath')
        path.unshift('.')
        return path.map((p) -> '\"' + parsePath p + '\"').join(', ')

    getProgramArgs: ->
        args = atom.config.get('agda-mode.programArgs')
        return _.compact(args.split(' '))

    # locate the path and see if it is truly a Agda process
    validateExecutablePath: (path = "") -> new Promise (resolve, reject) =>
        path = parsePath path
        try
            args = @getProgramArgs()
            args.push '-V'
            agdaProcess = spawn path, args
            agdaProcess.on 'error', (error) =>
                reject new InvalidExecutablePathError error, path
            agdaProcess.stdout.once 'data', (data) =>
                result = data.toString().match /^Agda version (.*)\n$/
                if result
                    # normalize version number to valid semver
                    rawVerNum = result[1]
                    semVerNum = _.take((result[1] + '.0.0.0').split('.'), 3).join('.')
                    @agdaVersion =
                        raw: rawVerNum
                        sem: semVerNum

                    atom.config.set 'agda-mode.executablePath', path
                    resolve path
                else
                    reject new InvalidExecutablePathError data.toString(), path
            agdaProcess.stderr.once 'data', (data) =>
                reject new ProcExecError data.toString()
        catch error
            if path is ""
                reject new InvalidExecutablePathError "Path must not be empty", path
            else
                reject new InvalidExecutablePathError error, path

    # keep banging the user until we got the right path
    queryExecutablePathUntilSuccess: (error) ->
        switch error.name
            when "ProcExecError"
                @core.panel.setContent "Process execution error", error.message.split('\n'), 'error'
            when "InvalidExecutablePathError"
                @core.panel.setContent "#{error.message}: \"#{error.path}\"", [], 'warning', 'path of executable here'
        @core.panel.query(false) # disable input method
            .then (path) =>
                path = parsePath path
                @validateExecutablePath path
                    .then (path) => path
                    .catch InvalidExecutablePathError, (error) => @queryExecutablePathUntilSuccess error
            .then (path) =>
                atom.config.set 'agda-mode.executablePath', path
                return path
            .catch InvalidExecutablePathError, (error) => @queryExecutablePathUntilSuccess error


    # get executable path from the settings
    # else by the command "which"
    # else query the user until success
    getExecutablePath: ->
        @getPathFromSettings()                                              #1
            .catch (error) => @getPathByWhich()                             #2
            .catch (error) => @queryExecutablePathUntilSuccess error        #3

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
                args.push '--interaction'
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

        if semver.gte(@agdaVersion.sem, '2.5.1')
            "(intervalsToRange (Just (mkAbsolute \"#{@core.getPath()}\")) [Interval
                (Pn
                    ()
                    #{startIndex + 3}
                    #{start.row + 1}
                    #{start.column + 3})
                (Pn
                    ()
                    #{endIndex - 1}
                    #{end.row + 1}
                    #{end.column - 1})])"
        else
            "(Range [Interval
                (Pn
                    (Just (mkAbsolute \"#{@core.getPath()}\"))
                    #{startIndex + 3}
                    #{start.row + 1}
                    #{start.column + 3})
                (Pn
                    (Just (mkAbsolute \"#{@core.getPath()}\"))
                    #{endIndex - 1}
                    #{end.row + 1}
                    #{end.column - 1})])"

    sendCommand: (highlightingLevel, interaction) ->
        @wireAgdaProcess().then (agdaProcess) =>
            filepath = @core.getPath()
            highlightingMethod = atom.config.get 'agda-mode.highlightingMethod'
            if typeof interaction is 'function' # it's a callback
                command = "IOTCM \"#{filepath}\" #{highlightingLevel} #{highlightingMethod} ( #{interaction()} )\n"
            else
                command = "IOTCM \"#{filepath}\" #{highlightingLevel} #{highlightingMethod} ( #{interaction} )\n"
            agdaProcess.stdin.write command
            return agdaProcess


    # New Command: 'load', 'toggle-display-of-implicit-arguments', 'show-constraints', 'solve-constraints', 'show-goals', 'why-in-scope', 'infer-type', 'module-contents', 'compute-normal-form', 'give', 'refine', 'auto', 'case', 'goal-type', 'context', 'goal-type-and-context', 'goal-type-and-inferred-type'
    # No Command: 'quit', 'restart', 'compile', 'info', 'next-goal', 'previous-goal'



    load: =>
        # force save before load, since we are sending filepath but content
        @core.textBuffer.saveBuffer()
        # if version > 2.5, ignore library path configuration
        @sendCommand "NonInteractive", =>
            if semver.gte(@agdaVersion.sem, '2.5.0')
                "Cmd_load \"#{@core.getPath()}\" []"
            else
                "Cmd_load \"#{@core.getPath()}\" [#{@getLibraryPath()}]"

        @core.commander.newCommand()

    quit: =>
        @agdaProcess.kill()
        @agdaProcessWired = false

    info: =>
        path = atom.config.get('agda-mode.executablePath')
        args = @getProgramArgs()
        args.unshift '--interaction'

        @core.panel.setContent "Info", [
            "Agda version: #{@agdaVersion.raw}"
            "Agda executable path: #{path}"
            "Agda executable arguments: #{args.join(' ')}"
        ]

    compile: =>
        backend = atom.config.get 'agda-mode.backend'
        # if version > 2.5, ignore library path configuration
        @sendCommand "NonInteractive", =>
            if semver.gte(@agdaVersion.sem, '2.5.0')
                "Cmd_compile #{backend} \"#{@core.getPath()}\" []"
            else
                "Cmd_compile #{backend} \"#{@core.getPath()}\" [#{@getLibraryPath()}]"

    toggleDisplayOfImplicitArguments: =>
        @sendCommand "NonInteractive", "ToggleImplicitArgs"
        @core.commander.newCommand()

    solveConstraints: =>
        @sendCommand "NonInteractive", "Cmd_solveAll"
        @core.commander.newCommand()
    showConstraints: =>
        @sendCommand "NonInteractive", "Cmd_constraints"
        @core.commander.newCommand()
    showGoals: =>
        @sendCommand "NonInteractive", "Cmd_metas"
        @core.commander.newCommand()
    whyInScope: (expr, goal) =>
        if goal
            @sendCommand "NonInteractive", "Cmd_why_in_scope #{goal.index} noRange \"#{expr}\""
        else
            @sendCommand "None", "Cmd_why_in_scope_toplevel \"#{expr}\""
        @core.commander.newCommand()

    inferType: (normalization, content, goal) =>
        if goal
            @sendCommand "NonInteractive", "Cmd_infer #{normalization} #{goal.index} noRange \"#{content}\""
        else
            @sendCommand "None", "Cmd_infer_toplevel #{normalization} \"#{content}\""
        @core.commander.newCommand()
    moduleContents: (normalization, content, goal) =>
        if goal
            @sendCommand "NonInteractive", "Cmd_show_module_contents #{normalization} #{goal.index} noRange \"#{content}\""
        else
            @sendCommand "None", "Cmd_show_module_contents_toplevel #{normalization} \"#{content}\""
        @core.commander.newCommand()
    computeNormalForm: (content, goal) =>
        if goal
            @sendCommand "NonInteractive", "Cmd_compute False #{goal.index} noRange \"#{content}\""
        else
            @sendCommand "None", "Cmd_compute_toplevel False \"#{content}\""
        @core.commander.newCommand()
    computeNormalFormIgnoreAbstract: (content, goal) =>
        if goal
            @sendCommand "NonInteractive", "Cmd_compute True #{goal.index} noRange \"#{content}\""
        else
            @sendCommand "None", "Cmd_compute_toplevel True \"#{content}\""
        @core.commander.newCommand()
    give: (goal) =>
        @sendCommand "NonInteractive", "Cmd_give #{goal.index} #{@buildRange goal} \"#{goal.getContent()}\""
        @core.commander.newCommand()
    refine: (goal) =>
        @sendCommand "NonInteractive", "Cmd_refine_or_intro False #{goal.index} #{@buildRange goal} \"#{goal.getContent()}\""
        @core.commander.newCommand()
    auto: (goal) =>
        @sendCommand "NonInteractive", "Cmd_auto #{goal.index} #{@buildRange goal} \"#{goal.getContent()}\""
        @core.commander.newCommand()
    case: (goal) =>
        @sendCommand "NonInteractive", "Cmd_make_case #{goal.index} #{@buildRange goal} \"#{goal.getContent()}\""
        @core.commander.newCommand()
    goalType: (normalization) => (goal) =>
        @sendCommand "NonInteractive", "Cmd_goal_type #{normalization} #{goal.index} noRange \"\""
        @core.commander.newCommand()
    context: (normalization) => (goal) =>
        @sendCommand "NonInteractive", "Cmd_context #{normalization} #{goal.index} noRange \"\""
        @core.commander.newCommand()
    goalTypeAndContext: (normalization) => (goal) =>
        @sendCommand "NonInteractive", "Cmd_goal_type_context #{normalization} #{goal.index} noRange \"\""
        @core.commander.newCommand()
    goalTypeAndInferredType: (normalization) => (goal) =>
        @sendCommand "NonInteractive", "Cmd_goal_type_context_infer #{normalization} #{goal.index} noRange \"#{goal.getContent()}\""
        @core.commander.newCommand()

module.exports = Process
