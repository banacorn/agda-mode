{spawn} = require 'child_process'
PathQueryView = require './path-query-view'
{EventEmitter} = require 'events'

module.exports = class AgdaInteractive extends EventEmitter

  # wired with Agda executable
  wired: false

  constructor: (@filename) ->


  # wire up with the Agda executable
  wire: ->
    executablePath = atom.config.get 'agda-mode.agdaExecutablePath'

    # try to catch EACCES, etc (yep, process.on 'uncaughtException' failed)
    try
      @agda = spawn executablePath, ['--interaction']
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


    @agda.stdout.on 'data', (data) =>

      if not @wired and /^Agda2/.test data
        @wired = true
        @emit 'start success'


      console.log data.toString()

    @agda.stderr.on 'data', (data) =>
      console.log data

    @agda.on 'close', (code) =>
      console.log 'agda process exited with code', code



  load: ->
    command = 'IOTCM "' + @filename + '" None Direct (Cmd_load "' + @filename + '" [])\n'
    @agda.stdin.write command

  quit: ->
    @agda.stdin.end()
