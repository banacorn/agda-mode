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

    startLeft  = @oldStart = @fromIndex startIndex
    startRight             = @fromIndex (startIndex + 2)
    endLeft                = @fromIndex endIndex
    endRight   = @oldEnd   = @fromIndex (endIndex + 2)

    @startMarker = @agda.editor.markBufferRange new Range(startLeft, startRight),
      type: 'hole'
    @endMarker = @agda.editor.markBufferRange new Range(endLeft, endRight),
      type: 'hole'

    @startMarker.on 'changed', (event) =>
      changed = @trimMarker()
      if changed
        @emit 'resized', @getStart(), @getEnd()

    @endMarker.on 'changed', (event) =>
      changed = @trimMarker()
      if changed
        @emit 'resized', @getStart(), @getEnd()

    # view
    view = new HoleView @agda, @

    # kick off
    @emit 'resized', @getStart(), @getEnd()

  # with boundaries {! #$% !}
  getText:        -> @agda.editor.getTextInRange       new Range(@startMarker.bufferMarker.getStartPosition(), @endMarker.bufferMarker.getEndPosition())
  setText: (text) -> @agda.editor.setTextInBufferRange new Range(@startMarker.bufferMarker.getStartPosition(), @endMarker.bufferMarker.getEndPosition()), text
  setTextInRange: (text, range) -> @agda.editor.setTextInBufferRange range, text

  # without boundaries and spaces
  getContent:        -> @agda.editor.getTextInRange       new Range(@startMarker.bufferMarker.getEndPosition(), @endMarker.bufferMarker.getStartPosition())
  setContent: (text) -> @agda.editor.setTextInBufferRange new Range(@startMarker.bufferMarker.getEndPosition(), @endMarker.bufferMarker.getStartPosition()), text

  getStart: -> @startMarker.bufferMarker.getStartPosition()
  setStart: (startLeft) ->
    startRight = @translate startLeft, 2
    @startMarker.bufferMarker.setRange new Range startLeft, startRight

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

  destroy: ->

    # console.log "[HOLE] #{@index} destroyed"

    @startMarker.destroy()
    @endMarker.destroy()

    @emit 'destroyed'


  # respecests character index
  translate: (pos, n) -> @fromIndex((@toIndex pos) + n)


module.exports = Hole
