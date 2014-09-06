{EventEmitter} = require 'events'
{Point} = require 'atom'
# manages all "holes" in a editor
class Hole extends EventEmitter

  holes = []

  constructor: (@agda) ->

    text = @agda.editor.getText()
    @headIndices = @indicesOf text, /\{!/
    @tailIndices = @indicesOf text, /!\}/


    @agda.editor.cursors[0].on 'moved', @skipHandler

  skipHandler: (event) =>
      cursorOld = event.oldBufferPosition
      cursorNew = event.newBufferPosition

      for headIndex, i in @headIndices
        tailIndex = @tailIndices[i]

        pointHead = @agda.editor.buffer.positionForCharacterIndex headIndex
        markerHead = @agda.editor.markBufferPosition pointHead

        pointTail = @agda.editor.buffer.positionForCharacterIndex tailIndex
        markerTail = @agda.editor.markBufferPosition pointTail

        # skip '{!'
        @skipBorder cursorOld, cursorNew, markerHead, 'left'

        # skip '!}'
        @skipBorder cursorOld, cursorNew, markerTail, 'right'

  skipBorder: (cursorOld, cursorNew, marker, direction) ->

    markerLeft = marker.oldHeadBufferPosition
    markerCenter = markerLeft.translate new Point 0, 1
    markerRight = markerLeft.translate new Point 0, 2

    if cursorNew.isEqual markerCenter
      if cursorOld.isEqual markerLeft
        # from left -->
        @agda.editor.setCursorBufferPosition markerRight
      else if cursorOld.isEqual markerRight
        # from right <--
        @agda.editor.setCursorBufferPosition markerLeft
      else
        # from somewhere else
        switch direction
          when 'left'
            @agda.editor.setCursorBufferPosition markerRight
          when 'right'
            @agda.editor.setCursorBufferPosition markerLeft


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
