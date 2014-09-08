{View, Point} = require 'atom'

module.exports = class HoleView extends View

  @content: ->
    @div outlet: 'hole', class: 'hole'


  initialize: (@agda, @marker) ->

    @setPosition @marker.oldTailBufferPosition, @marker.oldHeadBufferPosition

    @marker.on 'changed', (event) =>
      @setPosition event.newTailBufferPosition, event.newHeadBufferPosition

    @index = @marker.getAttributes().index

  setPosition: (markerStartPosition, markerEndPosition) ->
    pixelStartPosition = @agda.editor.pixelPositionForBufferPosition markerStartPosition
    pixelEndPosition = @agda.editor.pixelPositionForBufferPosition markerEndPosition
    bufferWidth = markerEndPosition.column - markerStartPosition.column
    pixelWidth = pixelEndPosition.left - pixelStartPosition.left
    text = '{!'
    for i in [1 .. bufferWidth - 4]
      text += ' '
    text += '!}'
    # @offset pixelStartPosition
    @css pixelStartPosition
    # console.log pixelStartPosition, bufferWidth, pixelWidth, @offset()

    @width pixelWidth
    @text text
  attach: ->
    @agda.editorView.overlayer.append @
