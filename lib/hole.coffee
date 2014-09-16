{EventEmitter} = require 'events'
{Point, Range} = require 'atom'
HoleView = require './view/hole'
HoleBoundary = require './view/hole'

# A Hole has 2 kinds of views
# 1. the {! !} pair
# 2. the highlighting

class Hole extends EventEmitter

  startMarker: null
  endMarker: null

  oldStart: null
  oldEnd: null


  constructor: (@agda, @index, startIndex, endIndex) ->

    start = @oldStart = @fromIndex startIndex
    end   = @oldEnd   = @fromIndex endIndex

    @startMarker = @agda.editor.markBufferPosition start,
      type: 'hole'
    @endMarker = @agda.editor.markBufferPosition end,
      type: 'hole'

    @startMarker.on 'changed', (event) =>
      changed = @trimMarker()
      if changed
        @emit 'resized', @getStart(), @getEnd()
    @endMarker.on 'changed', (event) =>
      changed = @trimMarker()
      if changed
        @emit 'resized', @getStart(), @getEnd()

    @oldText = @getText()

    # view
    view = new HoleView @agda, @

    # kick off
    @emit 'resized', @getStart(), @getEnd()

  getText: -> @agda.editor.getTextInRange new Range @getStart(), @getEnd()
  setText: (text) -> @agda.editor.setTextInBufferRange new Range(@getStart(), @getEnd()), text

  getStart: -> @startMarker.bufferMarker.getStartPosition()
  setStart: (pos) ->
    @startMarker.bufferMarker.setRange new Range pos, pos

  getEnd: -> @endMarker.bufferMarker.getStartPosition()
  setEnd: (pos) ->
    @endMarker.bufferMarker.setRange new Range pos, pos


  getRange: ->
    start = @startMarker.bufferMarker.getStartPosition()
    end = @endMarker.bufferMarker.getStartPosition()
    new Range start, end

  setRange: (range) ->
    start = new Range range.start, range.start
    end = new Range range.end, range.end

    @startMarker.setRange start
    @endMarker.setRange end

  # toIndex :: Position -> Character Index
  toIndex: (pos) -> @agda.editor.getBuffer().characterIndexForPosition pos

  # fromIndex :: Character Index -> Position
  fromIndex: (ind) -> @agda.editor.getBuffer().positionForCharacterIndex ind

  # trimMarker :: IO Changed
  #   recalculate the boundary of the marker
  trimMarker: ->

    text = @getText()



    # integrity of the boundaries
    newStartIndex = text.indexOf '{!'
    newEndIndex   = text.indexOf '!}'

    # the entire hole got destroyed, so be it
    if newStartIndex is -1 and newEndIndex is -1
      @destroy()
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
      startIndex = @toIndex @getStart()
      startIndex += left
      @setStart  (@fromIndex startIndex)

    if right isnt 0
      endIndex   = @toIndex @getEnd()
      endIndex   -= right
      @setEnd    (@fromIndex endIndex)


    # see if the boundaries really changed  (optimization stuff)
    newStart = @getStart()
    newEnd = @getEnd()


    changed = false

    if not @oldStart.isEqual newStart
      # console.log '{!', @oldStart.toArray(), '=>', newStart.toArray()
      @oldStart = newStart
      changed = true

    if not @oldEnd.isEqual newEnd
      # console.log '!}', @oldEnd.toArray(),   '=>', newEnd.toArray()
      @oldEnd = newEnd
      changed = true

    if changed
      @oldText = @getText()

    return changed



  restoreBoundary: ->
    @setText @oldText

module.exports = Hole
