{Point, Range} = require 'atom'
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
        command = 'IOTCM "' + @filepath + '" NonInteractive Indirect (Cmd_load "' + @filepath + '" ["./", "' + includeDir + '"])\n'
      else
        command = 'IOTCM "' + @filepath + '" NonInteractive Indirect (Cmd_load "' + @filepath + '" [])\n'

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
    @holeManager.nextGoal() if @loaded

  previousGoal: ->
    @holeManager.previousGoal() if @loaded

  give: ->
    if @loaded
      @atGoal()

  atGoal: ->
    cursor = @editor.getCursorBufferPosition()
    goals = @holeManager.holes.filter (hole) =>
       hole.getRange().containsPoint cursor

    # in certain hole
    if goals.length is 1
      goal = goals[0]
      index = goal.index
      start = goal.getStart()
      startIndex = goal.toIndex start
      end = goal.getEnd()
      endIndex = goal.toIndex end
      text = goal.getText()
      content = text.substring(2, text.length - 2)
      command = "IOTCM \"#{@filepath}\" NonInteractive Indirect \
        (Cmd_give #{index} (Range [Interval (Pn (Just (mkAbsolute \
        \"#{@filepath}\")) #{startIndex} #{start.row + 1} #{start.column + 1})\
         (Pn (Just (mkAbsolute \"#{@filepath}\")) #{endIndex} #{end.row + 1} \
          #{end.column + 1})]) \"#{content}\" )\n"
      @executable.agda.stdin.write command

    else
      console.log 'not in any goal'

module.exports = Agda
