{View, Point, $} = require 'atom'

module.exports = class HoleView extends View

  @content: ->
    @ul outlet: 'holeView'

  initialize: (@agda, @hole) ->

    @hole.on 'position-changed', @setPosition
    # @hole.on 'text-changed', @setText

    # text = ''
    # for i in [1 .. @width]
    #   text += ' '
    @text ' '

  setPosition: (startPosition, endPosition) =>
    @empty()
    blocks = @hole.range.getRows().map (row) =>
      position = @agda.editor.pixelPositionForBufferPosition new Point row, 0
      $('<div class="hole"> </div>').css
        top: position.top
        left: 0
        width: '100%'

    [first, ..., last] = blocks
    first.css @agda.editor.pixelPositionForBufferPosition startPosition
    last.width @agda.editor.pixelPositionForBufferPosition(endPosition).left
    blocks.forEach (div) =>
      @append div

  attach: ->
    @agda.editorView.overlayer.append @
