{Point, Range} = require 'atom'
AgdaSyntax = require './agda/syntax'
PanelView = require './view/panel'
AgdaExecutable = require './agda/executable'
HoleManager = require './hole-manager'
Stream = require './stream'
{EventEmitter} = require 'events'

# events:
#   activate
#   deactivate
#   quit

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
    @holeManager = new HoleManager @
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

      # initialize HoleManager per agda-mode:load
      @commandExecutor.once 'passed', =>

      @executable.agda.stdout
        .pipe new Stream.Rectify
        # .pipe new Stream.Log
        .pipe new Stream.Preprocess
        .pipe new Stream.ParseSExpr
        .pipe new Stream.ParseCommand
        .pipe @commandExecutor

      includeDir = atom.config.get 'agda-mode.agdaLibraryPath'
      if includeDir
        command = 'IOTCM "' + @filepath + '" NonInteractive Indirect (Cmd_load "' + @filepath + '" ["./", "' + includeDir + '"])\n'
      else
        command = 'IOTCM "' + @filepath + '" NonInteractive Indirect (Cmd_load "' + @filepath + '" [])\n'

      @holeManager.expandBoundaries()
      @executable.agda.stdin.write command
      @holeManager.load()

    @on 'activate', =>
      @active = true
      if @loaded
        @panelView.attach()

    @on 'deactivate', =>
      @active = false
      if @loaded
        @panelView.detach()

    @on 'hole-manager:initialized', => @restoreCursor()

    @on 'hole-manager:buffer-modified', => @editor.save()

  # saves current position of the cursor
  saveCursor: ->
    @cursorPositionLock = true
    @cursorPosition = @editor.getCursorBufferPosition()

  # restores cursor position, must be paired with @saveCursor
  restoreCursor: ->
    if @cursorPositionLock

      # see if the cursor position is now stucked in some hole's boundary,
      # if so, move it into the hole
      holes = @holeManager.holes.filter (hole) =>
        hole.getRange().containsPoint @cursorPosition

      # in some hole
      if holes.length is 1
        hole = holes[0]
        # console.log "[cursor] #{@cursorPosition.toArray()}"
        # console.log "[hole] #{hole.getRange().start.toArray()} #{hole.getRange().end.toArray()}"
        newCursorPosition = hole.translate hole.getStart(), 3
        @editor.setCursorBufferPosition newCursorPosition
      # not in some hole
      else
        @editor.setCursorBufferPosition @cursorPosition

      @cursorPositionLock = false

  #         #
  # comands #
  #         #

  load: ->
    console.log '========='
    @saveCursor()
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
    @holeManager.nextGoalCommand() if @loaded

  previousGoal: ->
    @holeManager.previousGoalCommand() if @loaded

  give: ->
    @holeManager.giveCommand() if @loaded




module.exports = Agda
