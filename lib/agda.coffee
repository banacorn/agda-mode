AgdaSyntax = require './agda/syntax'
PanelView = require './view/panel'
AgdaExecutable = require './agda/executable'
Stream = require './stream'
{EventEmitter} = require 'events'

class Agda extends EventEmitter

  executablePath: null
  loaded: false
  passed: false

  constructor: (@editor) ->
    @syntax = new AgdaSyntax @editor

    @filepath = @editor.getPath()

    @executable = new AgdaExecutable

    @panelView = new PanelView

    @registerHandlers()

  registerHandlers: ->

    @executable.on 'wired', =>
      @loaded = true

      @panelView.attach()

      @commandExecutor = new Stream.ExecuteCommand @panelView
      @commandExecutor.on 'passed', =>
        @passed = true
        @syntax.activate()

      @executable.agda.stdout
        .pipe new Stream.Rectify
        .pipe new Stream.Preprocess
        .pipe new Stream.Log
        .pipe new Stream.ParseSExpr
        .pipe new Stream.ParseCommand
        .pipe @commandExecutor

      includeDir = atom.config.get 'agda-mode.agdaLibraryPath'
      if includeDir
        command = 'IOTCM "' + @filepath + '" None Direct (Cmd_load "' + @filepath + '" ["./", "' + includeDir + '"])\n'
      else
        command = 'IOTCM "' + @filepath + '" None Direct (Cmd_load "' + @filepath + '" [])\n'
      @executable.agda.stdin.write command

  load: ->
    console.log '========='
    if not @loaded
      @executable.wire()
    else
      @restart()


  quit: ->
    if @loaded
      @loaded = false
      @passed = false
      @syntax.deactivate()

  restart: ->
    @quit()
    @executable.wire()

module.exports = Agda
