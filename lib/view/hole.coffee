{View, Point, $} = require 'atom'

module.exports = class HoleView extends View

  start: null
  end: null

  @content: ->
    @ul outlet: 'holeView'

  initialize: (@agda, @hole) ->

    @measureCharWidth()

    @hole.on 'destroyed', @destroy
    @hole.on 'resized', @resize

    @attach()

  resize: (start, end) =>
    console.log 'resize'
    @empty()
    blocks = @hole.getRange().getRows().map (row) =>
      position = @agda.editor.pixelPositionForBufferPosition new Point row, 0
      $('<div class="hole"> </div>').css
        top: position.top
        left: 0
        width: '100%'

    [firstLine, ..., lastLine] = blocks
    startPx = @agda.editor.pixelPositionForBufferPosition start
    endPx = @agda.editor.pixelPositionForBufferPosition end
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
