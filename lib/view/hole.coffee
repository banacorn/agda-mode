{View, Point} = require 'atom'

module.exports = class HoleView extends View

  @content: ->
    @div outlet: 'hole', class: 'hole'

  initialize: (@agda, @hole) ->

    {left} = @agda.editor.pixelPositionForBufferPosition new Point 0, 1
    @charWidth = left


    @hole.on 'position-changed', @setPosition
    # @hole.on 'text-changed', @setText

    indexLength = @hole.index.toString().length
    text = ''
    for i in [1 .. @hole.length - indexLength]
      text += ' '
    text += @hole.index.toString()
    @text text

  setPosition: (startPosition, endPosition) =>
    pixelStartPosition = @agda.editor.pixelPositionForBufferPosition startPosition
    pixelEndPosition = @agda.editor.pixelPositionForBufferPosition endPosition
    pixelWidth = @hole.length * @charWidth
    @css pixelStartPosition
    @width pixelWidth


  attach: ->
    @agda.editorView.overlayer.append @
