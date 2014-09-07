{View} = require 'atom'

module.exports = class HoleView extends View

  @content: ->
    @div outlet: 'hole', class: 'hole', '{}'

  initialize: (@agda, @marker) ->
    markerStartPosition = @marker.oldTailBufferPosition
    # markerEndPosition = @marker.oldHeadBufferPosition
    {top, left} = @agda.editorView.pixelPositionForScreenPosition markerStartPosition
    # end = @agda.editorView.pixelPositionForScreenPosition markerEndPosition
    # console.log end.left - left
    @offset
      top: top
      left: left
      # width: end.left - left

  attach: ->
    @agda.editorView.overlayer.append @
