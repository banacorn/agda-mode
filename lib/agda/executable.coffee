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

  loadCommand: (obj) ->
    includeDir = atom.config.get 'agda-mode.agdaLibraryPath'
    if includeDir
      command = "IOTCM \"#{obj.filepath}\" NonInteractive Indirect (Cmd_load \"#{obj.filepath}\" [\"./\", \"#{includeDir}\"])\n"
    else
      command = "IOTCM \"#{obj.filepath}\" NonInteractive Indirect (Cmd_load \"#{obj.filepath}\" [])\n"
    @process.stdin.write command

  quitCommand: ->
    @process.kill()
