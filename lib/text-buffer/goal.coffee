{EventEmitter} = require 'events'
{Point, Range} = require 'atom'
HoleView = require './hole-view'

INTACT = 0
DAMAGED = 1
DESTROYED = 2


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
        @decoration = @editor.decorateMarker @marker,
            type: 'highlight'
            class: 'goal'

        @marker.onDidChange (event) =>

            newRange = @marker.getBufferRange()
            {status, range} = @boundaryIntegrity()

            switch status
                when DESTROYED
                    @destroy()
                when DAMAGED
                    @restoreBoundary()
                when INTACT
                    @range = range
                    @content = @editor.getTextInRange range
                    @marker.setBufferRange range

    # boundaryIntegrity :: IO (status, new range)
    boundaryIntegrity: ->

        newRange = @marker.getBufferRange()
        text  = @editor.getTextInRange newRange
        left  = text.indexOf '{!'
        right = text.lastIndexOf '!}'

        # the entire goal got destroyed, so be it
        if left is -1 and right is -1
            status: DESTROYED
            range: null

        # partially damaged
        else if left is -1 or right is -1
            status: DAMAGED
            range: null

        # intact
        else if left isnt -1 and right isnt -1
            start = @translate newRange.start, left
            end   = @translate newRange.start, right + 2
            return {
                status: INTACT
                range: new Range(start, end)
            }
        else
            throw "WTF???"

    restoreBoundary: ->
        @editor.setTextInBufferRange @range, @content

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

    destroy: ->
        @marker.destroy()

    # toIndex :: Position -> Character Index
    toIndex: (pos) -> @editor.getBuffer().characterIndexForPosition pos

    # fromIndex :: Character Index -> Position
    fromIndex: (ind) -> @editor.getBuffer().positionForCharacterIndex ind

    # respects character index
    translate: (pos, n) -> @fromIndex((@toIndex pos) + n)


module.exports = Goal
