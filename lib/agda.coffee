AgdaSyntax = require './agda/syntax'
AgdaPathQueryView = require './agda/path-query-view'
AgdaExecutable = require './agda/executable'
Stream = require './agda/stream'

module.exports = class Agda

  executablePath: null
  loaded: false

  constructor: (@editor) ->
    @syntax = new AgdaSyntax @editor
    @syntax.deactivate()

    @filepath = @editor.getPath()
    @executable = new AgdaExecutable

    @registerHandlers()

  registerHandlers: ->

    @executable.on 'wired', =>
      @loaded = true
      @syntax.activate()
      # @interactive.load()

      @executable.agda.stdout
        .pipe new Stream.Rectifier
        .pipe new Stream.Preprocessor
        .pipe new Stream.SExpression
        .pipe new Stream.Command
        .pipe new Stream.ConsoleLog

      command = 'IOTCM "' + @filepath + '" None Direct (Cmd_load "' + @filepath + '" [])\n'
      @executable.agda.stdin.write command

  load: ->
    if not @loaded
      @executable.wire()
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
