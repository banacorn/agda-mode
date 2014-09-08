{View, Point} = require 'atom'

module.exports = class HoleView extends View

  @content: ->
    @div outlet: 'hole', class: 'hole'

  initialize: (@agda, @marker) ->

    @index = @marker.getAttributes().index

    markerStartPosition = @marker.oldTailBufferPosition
    markerEndPosition = @marker.oldHeadBufferPosition
    pixelStartPosition = @agda.editorView.pixelPositionForScreenPosition markerStartPosition
    pixelEndPosition = @agda.editorView.pixelPositionForScreenPosition markerEndPosition

    bufferWidth = markerEndPosition.column - markerStartPosition.column
    pixelWidth = pixelEndPosition.left - pixelStartPosition.left

    text = '#'
    for i in [1 .. bufferWidth - 2]
      text += ' '
    text += '#'
    console.log text

    @offset pixelStartPosition
    @width pixelWidth
    @text text
  attach: ->
    @agda.editorView.overlayer.append @
