{EventEmitter} = require 'events'
{Point, Range} = require 'atom'
HoleView = require './hole-view'

class Goal extends EventEmitter

    startMarker: null
    endMarker: null

    oldStart: null
    oldEnd: null


    constructor: (@editor, @index, startIndex, endIndex) ->

        startLeft  = @oldStart = @fromIndex startIndex
        startRight             = @fromIndex (startIndex + 2)
        endLeft                = @fromIndex (endIndex - 2)
        endRight   = @oldEnd   = @fromIndex endIndex

        @startMarker = @editor.markBufferRange new Range(startLeft, startRight),
            type: 'goal'
        @endMarker = @editor.markBufferRange new Range(endLeft, endRight),
            type: 'goal'

        @startMarker.on 'changed', (event) =>
            changed = @trimMarker()
            if changed
                @emit 'resized', @getStart(), @getEnd()

        @endMarker.on 'changed', (event) =>
            changed = @trimMarker()
            if changed
                @emit 'resized', @getStart(), @getEnd()

        # view
        view = new HoleView @editor, @

        # kick off
        @emit 'resized', @getStart(), @getEnd()

    # with boundaries {! #$% !}
    getText:        -> @editor.getTextInRange       new Range(@startMarker.bufferMarker.getStartPosition(), @endMarker.bufferMarker.getEndPosition())
    setText: (text) -> @editor.setTextInBufferRange new Range(@startMarker.bufferMarker.getStartPosition(), @endMarker.bufferMarker.getEndPosition()), text
    setTextInRange: (text, range) -> @editor.setTextInBufferRange range, text

    # without boundaries and spaces
    getContent:        -> @editor.getTextInRange(      new Range(@getInnerStart(), @getInnerEnd())).replace(/^\s\s*/, '').replace(/\s\s*$/, '')
    setContent: (text) -> @editor.setTextInBufferRange new Range(@startMarker.bufferMarker.getEndPosition(), @endMarker.bufferMarker.getStartPosition()), text

    getInnerStart: -> @translate(@startMarker.bufferMarker.getStartPosition(), 2)
    getStart: -> @startMarker.bufferMarker.getStartPosition()
    setStart: (startLeft) ->
        startRight = @translate startLeft, 2
        @startMarker.bufferMarker.setRange new Range startLeft, startRight

    getInnerEnd: -> @translate(@endMarker.bufferMarker.getEndPosition(), -2)
    getEnd: -> @endMarker.bufferMarker.getEndPosition()
    setEnd: (endRight) ->
        endLeft = @translate endRight, -2
        @endMarker.bufferMarker.setRange new Range endLeft, endRight

    getRange: ->
        start = @startMarker.bufferMarker.getStartPosition()
        end = @endMarker.bufferMarker.getEndPosition()
        new Range start, end

    setRange: (range) ->
        startRange = new Range range.start, @translate range.start, 2
        endRange   = new Range @translate range.end, -2, range.end

        @startMarker.setRange startRange
        @endMarker.setRange endRange

    # toIndex :: Position -> Character Index
    toIndex: (pos) -> @editor.getBuffer().characterIndexForPosition pos

    # fromIndex :: Character Index -> Position
    fromIndex: (ind) -> @editor.getBuffer().positionForCharacterIndex ind

    # trimMarker :: IO Changed
    #   recalculate the boundary of the marker
    trimMarker: ->
        text = @getText()


        # integrity of the boundaries
        newStartIndex = text.indexOf '{!'
        newEndIndex   = text.indexOf '!}'

        # the entire goal got destroyed, so be it
        if newStartIndex is -1 and newEndIndex is -1
            @emit 'destroyed'
            return true   # changed

        # attempt to damage boundaries, we should restore it
        else if newStartIndex is -1 or newEndIndex is -1
            @restoreBoundary()
            return false # not changed

        # determine if the marker doesn't match the boundary
        # if so, bend the marker back

        left  = text.indexOf('{!')
        right = text.length - text.indexOf('!}') - 2
        if left isnt 0
            @setStart(@translate @getStart(), left)

        if right isnt 0
            @setEnd(@translate @getEnd(), -right)

        # see if the boundaries really changed  (optimization stuff)
        newStart = @getStart()
        newEnd = @getEnd()

        # console.log '{!', @oldStart.toArray(), '=>', newStart.toArray()
        # console.log '!}', @oldEnd.toArray(), '=>', newEnd.toArray()
        changed = false

        if not @oldStart.isEqual newStart
            # console.log '{!', @oldStart.toArray(), '=>', newStart.toArray()
            @oldStart = newStart
            changed = true

        if not @oldEnd.isEqual newEnd
            # console.log '!}', @oldEnd.toArray(),   '=>', newEnd.toArray()
            @oldEnd = newEnd
            changed = true

        return changed

    restoreBoundary: ->
        @setTextInRange '{!', @startMarker.bufferMarker.range
        @setTextInRange '!}', @endMarker.bufferMarker.range

    removeBoundary: -> @setText @getContent().replace(/^\s\s*/, '').replace(/\s\s*$/, '')

    # replace and insert one or more lines of content at the goal
    # usage: spliting case
    writeLines: (contents) ->
        contents = contents.join('\n') + '\n'
        rows = @getRange().getRows()

        # single row
        if rows.length is 1
            [row] = rows
            @editor.getBuffer().deleteRow row
            position = @editor.getBuffer().rangeForRow(row).start
            @editor.getBuffer().insert position, contents

        # multi row
        else
            [firstRow, ..., lastRow] = rows
            @editor.getBuffer().deleteRows firstRow, lastRow
            position = @editor.getBuffer().rangeForRow(firstRow).start
            @editor.getBuffer().insert position, contents




    destroy: ->

        @startMarker.destroy()
        @endMarker.destroy()

        @emit 'destroyed'


    # respecests character index
    translate: (pos, n) -> @fromIndex((@toIndex pos) + n)


module.exports = Goal
