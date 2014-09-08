{View, Point} = require 'atom'

module.exports = class HoleView extends View

  @content: ->
    @div outlet: 'hole', class: 'hole'


  initialize: (@agda, @marker) ->

    @setPosition @marker.oldTailBufferPosition, @marker.oldHeadBufferPosition

    @marker.on 'changed', (event) =>

      range = @marker.bufferMarker.getRange()
      oldText = @marker.getAttributes().text
      newText = @agda.editor.getTextInRange range

      # text changed
      if oldText isnt newText
        console.log oldText, '==>', newText

        # opening mark got deleted
        if '{!' + newText is oldText
          console.log 'opening'
          @agda.editor.getBuffer().insert event.newTailBufferPosition, '{!'
        # closing mark got deleted
        else if newText + '!}' is oldText
          console.log 'closing'
          @agda.editor.getBuffer().insert event.newHeadBufferPosition, '!}'
        else
          console.log 'others'
          @marker.setAttributes
            text: newText
          @setPosition event.newTailBufferPosition, event.newHeadBufferPosition

      # position changed
      else
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

    @css pixelStartPosition
    @width pixelWidth
    @text text
  attach: ->
    @agda.editorView.overlayer.append @
