{Point, Range} = require 'atom'
AgdaSyntax = require './agda/syntax'

AgdaExecutable = require './agda/executable'

HoleManager = require './hole/manager'
ViewManager = require './view/manager'
Stream = require './stream'

{EventEmitter} = require 'events'

# events:
#   activate
#   deactivate
#   quit

class Agda extends EventEmitter

  executablePath: null
  active: false             # show panel view if active (tab focused)
  loaded: false             # code loaded by agda
  passed: false             # code loaded and passed by agda

  constructor: (@editorView) ->
    @editor = @editorView.getModel()
    @filepath = @editor.getPath()
    @syntax = new AgdaSyntax @editor
    @executable = new AgdaExecutable @
    @holeManager = new HoleManager @
    # view
    @view = new ViewManager



    @on 'activate', =>
      @active = true
      if @loaded
        @view.attachPanel()

    @on 'deactivate', =>
      @active = false
      if @loaded
        @view.detach()

    @on 'hole-manager:buffer-modified', => @saveBuffer()

  # saves current position of the cursor
  saveCursor: ->
    @cursorPositionLock = true
    @cursorPosition = @editor.getCursorBufferPosition()

  # restores cursor position, must be paired with @saveCursor
  restoreCursor: ->
    if @cursorPositionLock

      goal = @holeManager.inSomeHole()

      if goal
        newCursorPosition = goal.translate goal.getStart(), 3
        @editor.setCursorBufferPosition newCursorPosition
      else
        @editor.setCursorBufferPosition @cursorPosition

      @cursorPositionLock = false

  saveBuffer: -> @editor.save()

  #         #
  # comands #
  #         #

  load: ->

    if not @loaded
      console.log '==== LOAD ===='

      @saveCursor()
      @saveBuffer()

      # triggered when a Agda executable is found
      @executable.once 'wired', =>
        @loaded = true

        @view.attachPanel()

        @commandExecutor = new Stream.ExecuteCommand @

        @commandExecutor.on 'passed', =>
          @passed = true
          @syntax.activate()

        @executable.process.stdout
          .pipe new Stream.Rectify
          # .pipe new Stream.Log
          .pipe new Stream.Preprocess
          .pipe new Stream.ParseSExpr
          .pipe new Stream.ParseCommand
          .pipe @commandExecutor

        @executable.loadCommand
          filepath: @filepath

      @executable.wire()
    else
      @restart()

  quit: ->
    if @loaded
      @loaded = false
      @passed = false
      @syntax.deactivate()
      @view.detach()
      @emit 'quit'
      @executable.quitCommand()

  restart: ->
    @quit()
    @load()

  nextGoal: ->
    @holeManager.nextGoalCommand() if @loaded

  previousGoal: ->
    @holeManager.previousGoalCommand() if @loaded

  give: ->
    @holeManager.giveCommand() if @loaded

  goalType: ->
    @holeManager.goalTypeCommand() if @loaded

  context: ->
    @holeManager.contextCommand() if @loaded

  goalTypeAndContext: ->
    @holeManager.goalTypeAndContextCommand() if @loaded

  goalTypeAndInferredType: ->
    @holeManager.goalTypeAndInferredTypeCommand() if @loaded

  refine: ->
    @holeManager.refineCommand() if @loaded

  case: ->
    @holeManager.caseCommand() if @loaded

  auto: ->
    @holeManager.autoCommand() if @loaded

  normalize: ->
    hole = @holeManager.inSomeHole()
    content = hole?.getContent()
    contentNotEmpty = content and content?.replace(/\s/g, '').length isnt 0

    if hole and contentNotEmpty
      content = hole.getContent()
      @executable.normalizeCommand content
    else
      @view.attachInputBox @executable.normalizeCommand if @loaded


  input: ->

    console.log 'indent!!'

module.exports = Agda
