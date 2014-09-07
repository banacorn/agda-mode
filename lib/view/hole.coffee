{View, Point} = require 'atom'

module.exports = class HoleView extends View

  @content: ->
    @div outlet: 'hole', class: 'hole', '{}'

  initialize: (@agda, @marker) ->
    markerStartPosition = @marker.oldTailBufferPosition
    markerEndPosition = @marker.oldHeadBufferPosition.translate new Point 0, 2
    pixelStartPosition = @agda.editorView.pixelPositionForScreenPosition markerStartPosition
    pixelEndPosition = @agda.editorView.pixelPositionForScreenPosition markerEndPosition

    @offset pixelStartPosition
    @width pixelEndPosition.left - pixelStartPosition.left

  attach: ->
    @agda.editorView.overlayer.append @
