AgdaSyntax = require './agda/syntax'
AgdaPathQueryView = require './agda/path-query-view'
AgdaInteractive = require './agda/interactive'
{Stdout} = require './util'

module.exports = class Agda

  executablePath: null
  loaded: false

  constructor: (@editor) ->

    @syntax = new AgdaSyntax @editor
    @syntax.deactivate()

    @filepath = @editor.getPath()
    @interactive = new AgdaInteractive

    @registerHandlers()

  registerHandlers: ->

    @interactive.on 'wired', =>
      @loaded = true
      @syntax.activate()
      # @interactive.load()

      @interactive.agda.stdout.pipe (new Stdout)

      command = 'IOTCM "' + @filepath + '" None Direct (Cmd_load "' + @filepath + '" [])\n'
      @interactive.agda.stdin.write command

  load: ->
    if not @loaded
      @interactive.wire()
    else
      @restart()


  quit: ->
    if @loaded
      @loaded = false
      @syntax.deactivate()
      # @interactive.quit()

  restart: ->
    @quit()
    @load()
