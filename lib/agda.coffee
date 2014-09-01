AgdaSyntax = require './agda/syntax'
AgdaPathQueryView = require './agda/path-query-view'
AgdaExecutable = require './agda/executable'
Stream = require './agda/stream'

{Writable} = require 'stream'
code = require './agda/command-code'

class CommandExec extends Writable

  constructor: ->
    super
      objectMode: true

  _write: (command, encoding, next) ->
    console.log code.toString command.type
    console.log command
    #
    # switch command.type
    #   when code.


    next()

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
        .pipe new Stream.ConsoleLog
        # .pipe new Stream.Preprocessor
        # .pipe new Stream.SExpression
        # .pipe new Stream.Command
        # .pipe new CommandExec

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
