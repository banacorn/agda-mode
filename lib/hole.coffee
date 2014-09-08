{EventEmitter} = require 'events'
{Point, Range} = require 'atom'
HoleView = require './view/hole'



# manages all "holes" in a editor
class Hole extends EventEmitter

  constructor: (@agda) ->

    @destroyAllHoleMarkers()

    text = @agda.editor.getText()
    @headIndices = @indicesOf text, /\{!/
    @tailIndices = @indicesOf text, /!\}/

    # register all markers first
    for headIndex, i in @headIndices

      tailIndex = @tailIndices[i]

      # length of '!}'
      tailIndex += 2
      # width of the marker from head to toe
      width = tailIndex - headIndex
      pointHead = @agda.editor.buffer.positionForCharacterIndex headIndex
      pointTail = @agda.editor.buffer.positionForCharacterIndex tailIndex
      range = new Range pointTail, pointHead
      marker = @agda.editor.markBufferRange range,
        type: 'hole'
        index: i
        width: width
    @agda.editor.cursors[0].on 'moved', @skip

  findHoleMarkers: ->
    @agda.editor.findMarkers type: 'hole'

  destroyAllHoleMarkers: ->
    @findHoleMarkers().map (marker) => marker.destroy()

  skip: (event) =>
    cursorOld = event.oldBufferPosition
    cursorNew = event.newBufferPosition

    # 1 for forward =>
    # -1 for backward <=
    direction = cursorNew.compare cursorOld
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
        if direction is 1 # ==>
          @agda.editor.setCursorBufferPosition skipZoneHeadRight
        else              # <==
          @agda.editor.setCursorBufferPosition skipZoneHeadLeft

      if skipZoneTail.containsPoint cursorNew, true
        if direction is 1 # ==>
          @agda.editor.setCursorBufferPosition skipZoneTailRight
        else              # <==
          @agda.editor.setCursorBufferPosition skipZoneTailLeft

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

module.exports = Hole
