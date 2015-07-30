{Point, Range} = require 'atom'

class Goal

    marker = null
    range = null
    content = null

    constructor: (@editor, @index = '*', range) ->
        @range = @editor.fromCIRange range
        @content = @editor.getTextInRange @range
        @marker = @editor.markBufferRange @range

        # overlay element
        indexWidth = @index.toString().length
        element = document.createElement 'div'
        element.innerHTML = @index.toString()
        element.classList.add 'agda-goal-index'
        element.style.left = (- @editor.getDefaultCharWidth() * (indexWidth + 2)) + 'px'
        element.style.top  = (- @editor.getLineHeightInPixels()) + 'px'

        # decoration
        holeDecoration = @editor.decorateMarker @marker,
            type: 'highlight'
            class: 'agda-goal'

        indexDecoration = @editor.decorateMarker @marker,
            type: 'overlay'
            item: element

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
                innerStart = @editor.translate newRange.start, left
                innerEnd   = @editor.translate newRange.start, right + 2
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
        left = @editor.translate @range.start, 2
        right = @editor.translate @range.end, -2
        innerRange = new Range left, right
        @editor.getTextInBufferRange(innerRange)
            .trim()
            .replace(/\n/g, '\\n')
            .replace(/\"/g, '\\"')

    setContent: (text) ->
        left = @editor.translate @range.start, 2
        right = @editor.translate @range.end, -2
        innerRange = new Range left, right
        paddingSpaces = ' '.repeat(@index.toString().length)
        @editor.setTextInBufferRange innerRange, " #{text} #{paddingSpaces}"

    selectContent: ->
        left = @editor.translate @range.start, 3
        right = @editor.translate @range.end, -(3 + @index.toString().length)
        innerRange = new Range left, right
        @editor.setSelectedBufferRange innerRange

    # helper functions
    toIndex  : (pos) -> @editor.getBuffer().characterIndexForPosition pos
    fromIndex: (ind) -> @editor.getBuffer().positionForCharacterIndex ind
    translate: (pos, n) -> @fromIndex((@toIndex pos) + n)


module.exports = Goal
