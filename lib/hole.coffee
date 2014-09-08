{EventEmitter} = require 'events'
{Point, Range} = require 'atom'
HoleView = require './view/hole'

class Hole extends EventEmitter

  constructor: (@agda, i, headIndex, tailIndex) ->

    # width of the marker from head to toe
    @width = tailIndex - headIndex
    pointHead = @agda.editor.buffer.positionForCharacterIndex headIndex
    pointTail = @agda.editor.buffer.positionForCharacterIndex tailIndex
    range = new Range pointTail, pointHead
    @text = @agda.editor.getTextInRange range
    @marker = @agda.editor.markBufferRange range,
      type: 'hole'
      index: i
      width: @width,
      text: @text
    @view = new HoleView @agda, @
    @view.attach()

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
    @findHoleMarkers?().map (marker) =>

      # skip zone:
      #  __         ____
      # "{! foo bar !}42"

      skipZoneHeadLeft = marker.oldTailBufferPosition
      skipZoneHeadRight = marker.oldTailBufferPosition.translate new Point 0, 2
      skipZoneTailLeft = marker.oldHeadBufferPosition.translate new Point 0, -2
      skipZoneTailRight = marker.oldHeadBufferPosition
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
