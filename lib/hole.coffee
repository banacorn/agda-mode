{EventEmitter} = require 'events'
{Point, Range} = require 'atom'
HoleView = require './view/hole'

class Hole extends EventEmitter


  constructor: (@agda, i, headIndex, tailIndex) ->

    @index = i

    # register marker
    @setPositionAndRange @agda.editor.buffer.positionForCharacterIndex(headIndex), @agda.editor.buffer.positionForCharacterIndex(tailIndex)

    @marker = @agda.editor.markBufferRange @range, type: 'hole'
    @agda.editor.addSelectionForBufferRange @range
    # view
    view = new HoleView @agda, @
    view.attach()

    # text
    @text = @agda.editor.getTextInRange @range
    @emit 'position-changed', @startPosition, @endPosition
    @emit 'text-changed', @text

    @registerHandlers()

  setPositionAndRange: (startPosition, endPosition) ->
    @startPosition = startPosition
    @endPosition = endPosition
    @range = new Range startPosition, endPosition

  registerHandlers: ->

    @marker.on 'changed', (event) =>
      # calculate new marker range

      # leftPadding = newText.indexOf '{!'
      # rightPadding = newText.length - newText.indexOf('!}') - 2
      # @startPosition = event.newTailBufferPosition.translate new Point 0, leftPadding
      # @endPosition = event.newHeadBufferPosition.translate new Point 0, -rightPadding

      # console.log event.newHeadBufferPosition
      @setPositionAndRange event.newTailBufferPosition, event.newHeadBufferPosition

      @emit 'position-changed', @startPosition, @endPosition


  # 1 for cursor right =>
  # -1 for cursor right <=
  # 0 for jump-in
  cursorDirection: (cursorOld, cursorNew) ->
    diff = (a, b) ->
      [b.row - a.row, b.column - a.column]
    [rowDiff, columnDiff] = diff cursorOld, cursorNew
    if rowDiff is 0
      if columnDiff is 1
        return 1
      else if columnDiff is -1
        return -1
      else
        return 0
    else
      return 0

  skip: (event) =>
    cursorOld = event.oldBufferPosition
    cursorNew = event.newBufferPosition
    direction = @cursorDirection cursorOld, cursorNew

    # skip zone:
    #  __         ____
    # "{! foo bar !}42"

    skipZoneHeadLeft = @startPosition
    skipZoneHeadRight = @startPosition.translate new Point 0, 2
    skipZoneTailLeft = @endPosition.translate new Point 0, -2
    skipZoneTailRight = @endPosition
    skipZoneHead = new Range skipZoneHeadLeft, skipZoneHeadRight
    skipZoneTail = new Range skipZoneTailLeft, skipZoneTailRight

    if skipZoneHead.containsPoint cursorNew, true
      if direction is 1       # ==>
        @agda.editor.setCursorBufferPosition skipZoneHeadRight
      else if direction is -1 # <==
        @agda.editor.setCursorBufferPosition skipZoneHeadLeft
      else                    # random jump-in
        @agda.editor.setCursorBufferPosition skipZoneHeadRight

    if skipZoneTail.containsPoint cursorNew, true
      if direction is 1       # ==>
        @agda.editor.setCursorBufferPosition skipZoneTailRight
      else if direction is -1 # <==
        @agda.editor.setCursorBufferPosition skipZoneTailLeft
      else                    # random jump-in
        @agda.editor.setCursorBufferPosition skipZoneTailLeft

module.exports = Hole
