{Point} = require 'atom'
{$, View} = require 'atom-space-pen-views'
module.exports = class HoleView extends View

    start: null
    end: null

    @content: ->
        @ul outlet: 'goalView'

    initialize: (@editor, @goal) ->
        @measureCharWidth()

        # in case the index wasn't given
        @goal.index ?= '*'

        @goal.on 'destroyed', @destroy
        @goal.on 'resized', @resize
        @attach()

    resize: (start, end) =>
        @empty()
        blocks = @goal.getRange().getRows().map (row) =>

            position = atom.views.getView(@editor).pixelPositionForBufferPosition new Point row, 0

            $('<div class="goal"></div>').css
                top: position.top
                left: 0
                width: '100%'
            .text ' '


        [firstLine, ..., lastLine] = blocks
        startPx = atom.views.getView(@editor).pixelPositionForBufferPosition start
        endPx = atom.views.getView(@editor).pixelPositionForBufferPosition end

        # single row goal
        # from startPx to endPx
        if blocks.length is 1
            firstLine
                .css
                    top: startPx.top
                    left: startPx.left
                    paddingRight: @charWidth * 2
                .width endPx.left - startPx.left
                .text @goal.index.toString()
        # multi row goal
        # firstLine: from startPx to the end
        # lastLine from the start to endPx
        else
            firstLine.css startPx
            lastLine
                .css
                    paddingRight: @charWidth * 2
                .width endPx.left
                .text @goal.index.toString()


        blocks.forEach (div) =>
            @append div

    measureCharWidth: ->
        {left} = atom.views.getView(@editor).pixelPositionForBufferPosition new Point 0, 1
        @charWidth = left


    attach: ->
        atom.views.getView(@editor).__spacePenView.overlayer.append @

    destroy: =>
        # console.log "[HOLE VIEW] #{@goal.index} DETACH"
        @detach()
