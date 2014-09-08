{EventEmitter} = require 'events'
{Point, Range} = require 'atom'
HoleView = require './view/hole'

class Hole extends EventEmitter

  constructor: (@agda, i, headIndex, tailIndex) ->

    # register marker
    startPosition = @agda.editor.buffer.positionForCharacterIndex headIndex
    endPosition = @agda.editor.buffer.positionForCharacterIndex tailIndex
    range = new Range endPosition, startPosition
    @marker = @agda.editor.markBufferRange range, type: 'hole'

    # view
    view = new HoleView @agda, @
    view.attach()

    # text
    text = @agda.editor.getTextInRange range

    @emit 'position-changed', startPosition, endPosition
    @emit 'text-changed', text

    @registerHandlers()

  registerHandlers: ->
    #
    # @marker.on

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

    skipZoneHeadLeft = @marker.oldTailBufferPosition
    skipZoneHeadRight = @marker.oldTailBufferPosition.translate new Point 0, 2
    skipZoneTailLeft = @marker.oldHeadBufferPosition.translate new Point 0, -2
    skipZoneTailRight = @marker.oldHeadBufferPosition
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
