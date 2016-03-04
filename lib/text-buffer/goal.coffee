{Point, Range} = require 'atom'
parse = require './../parser'

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

            # special case: "{!}"
            if left is 0 and right is 1
                @restoreBoundary()

            # the entire goal got destroyed, so be it
            else if left is -1 and right is -1
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
        left = @editor.translate @range.start, 2
        right = @editor.translate @range.end, -2
        innerRange = new Range left, right
        rawContent = @editor.getTextInBufferRange(innerRange)
        @editor.setTextInBufferRange @range, rawContent.trim()

    # replace and insert one or more lines of content at the goal
    # usage: splitting case
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

    # rewrite lambda expression
    # not only the goal itself, the clause it belongs to also needs to be rewritten
    writeLambda: (contents) ->

        # range to scan
        textBuffer = @editor.getBuffer()
        beforeRange = new Range(textBuffer.getFirstPosition(), @range.start)
        afterRange = new Range(@range.end, textBuffer.getEndPosition())

        # scan and build the range to replace text with
        @editor.backwardsScanInBufferRange /\;\s*|\{\s*/, beforeRange, (result) =>
            rewriteRangeStart = result.range.end
            result.stop()
            @editor.scanInBufferRange /\s*\;|\s*\}/, afterRange, (result) =>
                rewriteRangeEnd = result.range.start
                result.stop()
                rewriteRange = new Range rewriteRangeStart, rewriteRangeEnd
                @editor.setTextInBufferRange rewriteRange, contents.join(' ; ')

    getContent: ->
        left = @editor.translate @range.start, 2
        right = @editor.translate @range.end, -2
        innerRange = new Range left, right
        rawContent = @editor.getTextInBufferRange(innerRange)
        parse.inputContent rawContent

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

    isEmpty: -> @getContent().replace(/(\s|\\n)*/, '').length is 0

    # helper functions
    toIndex  : (pos) -> @editor.getBuffer().characterIndexForPosition pos
    fromIndex: (ind) -> @editor.getBuffer().positionForCharacterIndex ind
    translate: (pos, n) -> @fromIndex((@toIndex pos) + n)


module.exports = Goal
