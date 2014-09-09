{Point} = require 'atom'
AgdaSyntax = require './agda/syntax'
PanelView = require './view/panel'
AgdaExecutable = require './agda/executable'
Stream = require './stream'
{EventEmitter} = require 'events'

class Agda extends EventEmitter

  executablePath: null
  active: false
  loaded: false
  passed: false

  constructor: (@editorView) ->
    @editor = @editorView.getModel()
    @syntax = new AgdaSyntax @editor

    @filepath = @editor.getPath()

    @executable = new AgdaExecutable

    @panelView = new PanelView
    @registerHandlers()

  registerHandlers: ->

    @executable.on 'wired', =>
      @loaded = true

      @panelView.attach()

      @commandExecutor = new Stream.ExecuteCommand @
      @commandExecutor.on 'passed', =>
        @passed = true
        @syntax.activate()

      @executable.agda.stdout
        .pipe new Stream.Rectify
        .pipe new Stream.Log
        .pipe new Stream.Preprocess
        .pipe new Stream.ParseSExpr
        .pipe new Stream.ParseCommand
        .pipe @commandExecutor

      includeDir = atom.config.get 'agda-mode.agdaLibraryPath'
      if includeDir
        command = 'IOTCM "' + @filepath + '" None Direct (Cmd_load "' + @filepath + '" ["./", "' + includeDir + '"])\n'
      else
        command = 'IOTCM "' + @filepath + '" None Direct (Cmd_load "' + @filepath + '" [])\n'
      @executable.agda.stdin.write command

    @on 'activate', =>
      @active = true
      if @loaded
        @panelView.attach()

    @on 'deactivate', =>
      @active = false
      if @loaded
        @panelView.detach()

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
      @panelView.detach()
      @emit 'quit'

  restart: ->
    @quit()
    @executable.wire()

  nextGoal: ->
    if @loaded

      cursor = @editor.getCursorBufferPosition()
      nextGoal = null

      positions = @editor
        .findMarkers type: 'hole'
        .map (marker) => marker.getTailBufferPosition().translate new Point 0, 3

      positions.forEach (position) =>
        if position.isGreaterThanOrEqual cursor
          nextGoal ?= position

      # no hole ahead of cursor, loop back
      if nextGoal is null
        nextGoal = positions[0]

      @editor.setCursorBufferPosition nextGoal

  previousGoal: ->
    if @loaded
      console.log 'previous goal'

module.exports = Agda
