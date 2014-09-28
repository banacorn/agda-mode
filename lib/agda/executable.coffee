{spawn} = require 'child_process'
{EventEmitter} = require 'events'

module.exports = class AgdaExecutable extends EventEmitter

  constructor: (@agda) ->

  # wire up with the Agda executable
  wire: ->
    executablePath = atom.config.get 'agda-mode.agdaExecutablePath'


    # try to catch EACCES, etc (yep, process.on 'uncaughtException' failed)
    try
      @process = spawn executablePath, ['--interaction']
      @process.wired = false

    catch error
      @agda.view.queryPath =>
        @wire()
      return

    # catch other forms of errors
    @process.on 'error', (error) =>
      @agda.view.queryPath =>
        @wire()

    @process.stdout.once 'data', (data) =>
      # run only when the executable was just wired
      if not @process.wired and /^Agda2/.test data
        @process.wired = true
        @emit 'wired'


  #
  #   Commands
  #

  loadCommand: ->
    includeDir = atom.config.get 'agda-mode.agdaLibraryPath'
    if includeDir
      command = "IOTCM \"#{@agda.filepath}\" NonInteractive Indirect (Cmd_load \"#{@agda.filepath}\" [\"./\", \"#{includeDir}\"])\n"
    else
      command = "IOTCM \"#{@agda.filepath}\" NonInteractive Indirect (Cmd_load \"#{@agda.filepath}\" [])\n"
    @process.stdin.write command

  quitCommand: ->
    @process.kill()

  normalizeCommand: (content) =>

    command = "IOTCM \"#{@agda.filepath}\" None Indirect ( Cmd_compute_toplevel False \"#{content}\" )\n"
    @process.stdin.write command
