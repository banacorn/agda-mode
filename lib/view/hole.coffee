{View, Point, $} = require 'atom'

module.exports = class HoleView extends View

  @content: ->
    @ul outlet: 'holeView'

  initialize: (@agda, @hole) ->
    @measureCharWidth()

    @hole.on 'destroyed', @destroy
    @hole.on 'position-changed', @setPosition

  setPosition: (startPosition, endPosition) =>
    # console.log 'view should change', startPosition.toArray(), endPosition.toArray()
    @empty()
    # console.log @hole.range.getRows()
    blocks = @hole._range.getRows().map (row) =>
      position = @agda.editor.pixelPositionForBufferPosition new Point row, 0
      $('<div class="hole"> </div>').css
        top: position.top
        left: 0
        width: '100%'

    [firstLine, ..., lastLine] = blocks
    startPx = @agda.editor.pixelPositionForBufferPosition startPosition
    endPx = @agda.editor.pixelPositionForBufferPosition endPosition
    if blocks.length is 1
      firstLine
        .css startPx
        .width endPx.left - startPx.left
    else
      firstLine.css startPx
      lastLine.width endPx.left
    blocks.forEach (div) =>
      @append div

  measureCharWidth: ->
    {left} = @agda.editor.pixelPositionForBufferPosition new Point 0, 1
    @charWidth = left


  attach: ->
    @agda.editorView.overlayer.append @


  destroy: =>
    @detach()
