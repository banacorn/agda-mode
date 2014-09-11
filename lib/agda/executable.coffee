{spawn} = require 'child_process'
PathQueryView = require './../view/path-query'
{EventEmitter} = require 'events'

module.exports = class AgdaExecutable extends EventEmitter

  constructor: ->

  # wire up with the Agda executable
  wire: ->
    executablePath = atom.config.get 'agda-mode.agdaExecutablePath'


    # try to catch EACCES, etc (yep, process.on 'uncaughtException' failed)
    try
      @agda = spawn executablePath, ['--interaction']
      @agda.wired = false
    catch error
      pathQueryView = new PathQueryView
      pathQueryView.query()
      pathQueryView.one 'agda-path-query-view.success', (el, path) =>
        @wire()
      return

    # catch other forms of errors
    @agda.on 'error', (error) =>
      pathQueryView = new PathQueryView
      pathQueryView.query()
      pathQueryView.one 'agda-path-query-view.success', (el, path) =>
        @wire()

    @agda.stdout.once 'data', (data) =>
      # run only when the executable was just wired
      if not @agda.wired and /^Agda2/.test data
        @agda.wired = true
        @emit 'wired'

  # load: ->
  #   command = 'IOTCM "' + @filename + '" None Direct (Cmd_load "' + @filename + '" [])\n'
  #   @agda.stdin.write command
