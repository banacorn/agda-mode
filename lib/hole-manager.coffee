{EventEmitter} = require 'events'
{Point, Range} = require 'atom'
Hole = require './hole'

# manages all "holes" in a editor
class HoleManager extends EventEmitter

  holes: []

  constructor: (@agda) ->

    @destroyHoles()
    @expandBoundaries()

    text = @agda.editor.getText()
    headIndices = @indicesOf text, /\{!/
    tailIndices = @indicesOf text, /!\}/

    # register all markers first
    for headIndex, i in headIndices

      tailIndex = tailIndices[i]

      # length of '!}' and hole index
      tailIndex += 2
      @holes.push new Hole(@agda, i, headIndex, tailIndex)

    @agda.once 'quit', @destroyHoles

  # convert all '?' to '{!!}'
  expandBoundaries: ->
    rawText = @agda.editor.getText()
    convertSpaced = rawText.split(' ? ').join(' {!  !} ')
    convertNewlined = convertSpaced.split(' ?\n').join(' {!  !}\n')
    @agda.editor.setText convertNewlined

  destroyHoles: =>
    # first, destroy all Holes
    @holes.forEach (hole) =>
      hole.emit 'destroyed'
      @holes = []
    # second, destroy wandering markers
    markers = @agda.editor.findMarkers type: 'hole'
    markers.map (marker) => marker.destroy()

  indicesOf: (string, pattern) ->
    indices = []
    cursor = 0
    result = string.match pattern
    while result
      indices.push result.index + cursor
      cursor += result.index + result[0].length
      string = string.substr (result.index + result[0].length)
      result = string.match pattern
    return indices

  findHole: (index) ->
    holes = @holes.filter (hole) => hole.index is index
    return holes[0]

  destroyHole: (index) ->
    @holes.filter (hole, i) =>
      hole.index is index
      hole.destroy()
      @holes.splice i, 1

  #
  # agda-mode: next-goal
  #
  nextGoalCommand: ->
    cursor = @agda.editor.getCursorBufferPosition()
    nextGoal = null

    positions = @holes.map (hole) =>
      start = hole.getStart()
      hole.translate start, 3

    positions.forEach (position) =>
      if position.isGreaterThan cursor
        nextGoal ?= position

    # no hole ahead of cursor, loop back
    if nextGoal is null
      nextGoal = positions[0]

    # jump only when there are goals
    if positions.length isnt 0
      @agda.editor.setCursorBufferPosition nextGoal

  #
  # agda-mode: previous-goal
  #
  previousGoalCommand: ->
    cursor = @agda.editor.getCursorBufferPosition()
    previousGoal = null

    positions = @holes.map (hole) =>
      start = hole.getStart()
      hole.translate start, 3

    positions.forEach (position) =>
      if position.isLessThan cursor
        previousGoal = position

    # no hole ahead of cursor, loop back
    if previousGoal is null
      previousGoal = positions[positions.length - 1]

    # jump only when there are goals
    if positions.length isnt 0
      @agda.editor.setCursorBufferPosition previousGoal


  #
  # agda-mode: give
  #
  giveCommand: ->
    cursor = @agda.editor.getCursorBufferPosition()
    goals = @holes.filter (hole) =>
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
      command = "IOTCM \"#{@agda.filepath}\" NonInteractive Indirect \
        (Cmd_give #{index} (Range [Interval (Pn (Just (mkAbsolute \
        \"#{@agda.filepath}\")) #{startIndex} #{start.row + 1} #{start.column + 1})\
         (Pn (Just (mkAbsolute \"#{@agda.filepath}\")) #{endIndex} #{end.row + 1} \
          #{end.column + 1})]) \"#{content}\" )\n"
      @agda.executable.agda.stdin.write command

    else
      @agda.panelView.setStatus 'Info'
      @agda.panelView.setContent ['For this command, please place the cursor in a goal']

  giveHandler: (index) ->
    @holes.forEach (hole) =>
      if hole.index is index

        # destroy the hole
        hole.removeBoundary()
        hole.destroy()
        @holes.splice index, 1

        # save the buffer
        @agda.editor.save()

        return
module.exports = HoleManager
