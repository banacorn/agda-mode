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
    @empty()

    blocks = @hole.getRange().getRows().map (row) =>

      position = @agda.editor.pixelPositionForBufferPosition new Point row, 0

      $('<div class="hole"></div>').css
          top: position.top
          left: 0
          width: '100%'
      .text ' '


    [firstLine, ..., lastLine] = blocks
    startPx = @agda.editor.pixelPositionForBufferPosition start
    endPx = @agda.editor.pixelPositionForBufferPosition end

    # single row hole
    # from startPx to endPx
    if blocks.length is 1
      firstLine
        .css
          top: startPx.top
          left: startPx.left
          paddingRight: @charWidth * 2
        .width endPx.left - startPx.left
        .text @hole.index.toString()
    # multi row hole
    # firstLine: from startPx to the end
    # lastLine from the start to endPx
    else
      firstLine.css startPx
      lastLine
        .css
          paddingRight: @charWidth * 2
        .width endPx.left
        .text @hole.index.toString()


    blocks.forEach (div) =>
      @append div

  measureCharWidth: ->
    {left} = @agda.editor.pixelPositionForBufferPosition new Point 0, 1
    @charWidth = left


  attach: ->
    @agda.editorView.overlayer.append @


  destroy: =>
    # console.log "[HOLE VIEW] #{@hole.index} DETACH"
    @detach()
