{View, Point} = require 'atom'

module.exports = class HoleView extends View

  @content: ->
    @div outlet: 'hole', class: 'hole'

  initialize: (@agda, @hole) ->

    @hole.on 'position-changed', @setPosition
    # @hole.on 'text-changed', @setText

    text = ''
    for i in [1 .. @width]
      text += ' '
    @text ' '

  setPosition: (startPosition, endPosition) =>
    pixelStartPosition = @agda.editor.pixelPositionForBufferPosition startPosition
    pixelEndPosition = @agda.editor.pixelPositionForBufferPosition endPosition
    pixelWidth = pixelEndPosition.left - pixelStartPosition.left
    @css pixelStartPosition
    @width pixelWidth


  attach: ->
    @agda.editorView.overlayer.append @
