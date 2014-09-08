{View, Point} = require 'atom'

module.exports = class HoleView extends View

  @content: ->
    @div outlet: 'hole', class: 'hole'


  initialize: (@agda, @hole) ->

    @hole.on 'position-changed', @setPosition



    @hole.on 'text-changed', @setText


    # @setPosition @hole.startPosition, @hole.endPosition
    # @marker = @hole.marker
    # @setPosition @marker.oldTailBufferPosition, @marker.oldHeadBufferPosition
    #
    # @marker.on 'changed', (event) =>
    #
    #   range = @marker.bufferMarker.getRange()
    #   oldText = @marker.getAttributes().text
    #   newText = @agda.editor.getTextInRange range
    #
    #   # text changed
    #   if oldText isnt newText
    #     console.log oldText, '==>', newText
    #
    #     # opening mark got deleted
    #     if '{!' + newText is oldText
    #       console.log 'opening'
    #       @agda.editor.getBuffer().insert event.newTailBufferPosition, '{!'
    #     # closing mark got deleted
    #     else if newText + '!}' is oldText
    #       console.log 'closing'
    #       @agda.editor.getBuffer().insert event.newHeadBufferPosition, '!}'
    #     else
    #       console.log 'others'
    #       @marker.setAttributes
    #         text: newText
    #       @setPosition event.newTailBufferPosition, event.newHeadBufferPosition
    #
    #   # position changed
    #   else
    #     @setPosition event.newTailBufferPosition, event.newHeadBufferPosition
    # @index = @marker.getAttributes().index

  setPosition: (startPosition, endPosition) =>
    pixelStartPosition = @agda.editor.pixelPositionForBufferPosition startPosition
    pixelEndPosition = @agda.editor.pixelPositionForBufferPosition endPosition
    pixelWidth = pixelEndPosition.left - pixelStartPosition.left
    @css pixelStartPosition
    @width pixelWidth

  setText: (text) =>
    console.log text
    @text '#'

  attach: ->
    @agda.editorView.overlayer.append @
