{EventEmitter} = require 'events'
{Point, Range} = require 'atom'
{$, View} = require 'atom-space-pen-views'

class GoalIndexView extends View
    @content: (editor, index) ->
        @div class: 'agda-goal-index', index
    initialize: (@editor, @index) ->
        # adjust the position, outlet not functioning
        element = $(@)[0]
        element.style.left = (- @editor.getDefaultCharWidth() * 2) + 'px'
        element.style.top  = (- @editor.getLineHeightInPixels()) + 'px'

class Goal extends EventEmitter

    marker = null
    range = null
    content = null

    constructor: (@editor, @index, startIndex, endIndex) ->

        start = @fromIndex startIndex
        end   = @fromIndex endIndex

        @range = new Range(start, end)
        @content = @editor.getTextInRange @range
        @marker = @editor.markBufferRange @range

        # decoration
        holeDecoration = @editor.decorateMarker @marker,
            type: 'highlight'
            class: 'agda-goal'

        indexDecoration = @editor.decorateMarker @marker,
            type: 'overlay'
            item: new GoalIndexView @editor, @index

        # event
        @marker.onDidChange (event) =>

            newRange = @marker.getBufferRange()

            # boundary position
            text  = @editor.getTextInRange newRange
            left  = text.indexOf '{!'
            right = text.lastIndexOf '!}'

            # the entire goal got destroyed, so be it
            if left is -1 and right is -1
                @destroy()

            # partially damaged
            else if left is -1 or right is -1
                @restoreBoundary()

            # intact
            else if left isnt -1 and right isnt -1

                # inner range
                innerStart = @translate newRange.start, left
                innerEnd   = @translate newRange.start, right + 2
                innerRange = new Range innerStart, innerEnd

                # update states
                @range = innerRange
                @content = @editor.getTextInRange innerRange
                @marker.setBufferRange innerRange

            else
                throw "WTF???"

    destroy: ->
        @marker.destroy()

    restoreBoundary: ->
        @editor.setTextInBufferRange @range, @content

    removeBoundary: ->
        @editor.setTextInBufferRange @range, @getContent()

    # replace and insert one or more lines of content at the goal
    # usage: spliting case
    writeLines: (contents) ->
        rows = @range.getRows()
        firstRowRange = @editor.getBuffer().rangeForRow rows[0]
        # indent and join with \n
        indentSpaces = @editor.getTextInBufferRange(firstRowRange).match(/^(\s)*/)[0]
        contents = contents.map((s) -> indentSpaces + s).join('\n') + '\n'

        # delete original rows
        if rows.length is 1
            [row] = rows
            @editor.getBuffer().deleteRow row
        else
            [firstRow, ..., lastRow] = rows
            @editor.getBuffer().deleteRows firstRow, lastRow

        # insert case split content
        position = firstRowRange.start
        @editor.getBuffer().insert position, contents

    getContent: ->
        left = @translate @range.start, 2
        right = @translate @range.end, -2
        innerRange = new Range left, right
        @editor.getTextInBufferRange(innerRange).trim()

    setContent: (text) ->
        left = @translate @range.start, 2
        right = @translate @range.end, -2
        innerRange = new Range left, right
        @editor.setTextInBufferRange innerRange, text

    # helper functions
    toIndex  : (pos) -> @editor.getBuffer().characterIndexForPosition pos
    fromIndex: (ind) -> @editor.getBuffer().positionForCharacterIndex ind
    translate: (pos, n) -> @fromIndex((@toIndex pos) + n)


module.exports = Goal
