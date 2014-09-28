{Point, Range} = require 'atom'
AgdaSyntax = require './agda/syntax'

AgdaExecutable = require './agda/executable'

GoalManager = require './goal/manager'
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
    @goalManager = new GoalManager @
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

    @on 'goal-manager:buffer-modified', => @saveBuffer()

  # saves current position of the cursor
  saveCursor: ->
    @cursorPositionLock = true
    @cursorPosition = @editor.getCursorBufferPosition()

  # restores cursor position, must be paired with @saveCursor
  restoreCursor: ->
    if @cursorPositionLock

      goal = @goalManager.inSomeGoal()

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
    @goalManager.nextGoalCommand() if @loaded

  previousGoal: ->
    @goalManager.previousGoalCommand() if @loaded

  give: ->
    @goalManager.giveCommand() if @loaded

  goalType: ->
    @goalManager.goalTypeCommand() if @loaded

  context: ->
    @goalManager.contextCommand() if @loaded

  goalTypeAndContext: ->
    @goalManager.goalTypeAndContextCommand() if @loaded

  goalTypeAndInferredType: ->
    @goalManager.goalTypeAndInferredTypeCommand() if @loaded

  refine: ->
    @goalManager.refineCommand() if @loaded

  case: ->
    @goalManager.caseCommand() if @loaded

  auto: ->
    @goalManager.autoCommand() if @loaded

  normalize: ->
    goal = @goalManager.inSomeGoal()
    content = goal?.getContent()
    contentNotEmpty = content and content?.replace(/\s/g, '').length isnt 0

    if goal and contentNotEmpty
      content = goal.getContent()
      @executable.normalizeCommand content
    else
      @view.attachInputBox @executable.normalizeCommand if @loaded


  input: ->

    console.log 'indent!!'

module.exports = Agda
