{EventEmitter} = require 'events'
{Point, Range} = require 'atom'
HoleView = require './view/hole'

class Hole extends EventEmitter

  # Points representing the boundary of the Hole
  _start: null
  _end: null

  # Range
  _range: null

  # Marker
  _marker: null

  constructor: (@agda, i, headIndex, tailIndex) ->

    start = @agda.editor.buffer.positionForCharacterIndex headIndex
    end = @agda.editor.buffer.positionForCharacterIndex tailIndex
    @initPosition start, end
    @trimHole()

    @initWatcher()


    @registerHandlers()

    # view
    view = new HoleView @agda, @
    view.attach()
    @emit 'position-changed', @_start, @_end

  initPosition: (start, end) ->
    @_start = start
    @_end = end
    @_range = new Range start, end
    @_marker = @agda.editor.markBufferRange @_range, type: 'hole'

  updatePosition: (start, end) ->

    changed = not start.isEqual(@_start) or not end.isEqual(@_end)

    if changed
      # console.log '== changed =='
      # console.log @_start.toArray(), '==>', start.toArray()
      # console.log @_end.toArray(), '==>', end.toArray()
      @_start = start
      @_end = end
      @_range = new Range start, end
      @_marker.setHeadBufferPosition end
      @_marker.setTailBufferPosition start

      @emit 'position-changed', start, end

  # calculate new marker range
  trimHole: ->
    oldText = @text
    newText = @agda.editor.getTextInRange @_marker.bufferMarker.getRange()

    # decide how much to trim
    leftIndex = newText.indexOf '{!'
    rightIndex = newText.indexOf '!}'
    if leftIndex is -1 or rightIndex is -1
      @destroy()
      return

    left = leftIndex
    right = newText.length - newText.indexOf('!}') - 2

    # convert original position to character index
    start = @agda.editor.getBuffer().characterIndexForPosition @_start
    end = @agda.editor.getBuffer().characterIndexForPosition @_end

    # translate character index according to much to trim
    start += left
    end -= right

    # convert translated character index back to position
    start = @agda.editor.getBuffer().positionForCharacterIndex start
    end = @agda.editor.getBuffer().positionForCharacterIndex end
    # console.log left, right
    # console.log @_start.toArray(), @_end.toArray()
    # console.log start.toArray(), end.toArray()

    @updatePosition start, end



  registerHandlers: ->
    @_marker.on 'changed', (event) =>
      start = event.newTailBufferPosition
      end = event.newHeadBufferPosition
      @updatePosition start, end
      @trimHole()

  destroy: ->
    @_marker.destroy()
    @_watcher.destroy()
    @emit 'destroyed'

  # fucking ugly hack, to monitor text modification at the start of the marker

  initWatcher: ->
    @_watcher = @agda.editor.markBufferPosition @_start, type: 'hole-watcher'

    @_watcher.on 'changed', (event) =>

      @trimHole()

  updateWatcher: ->
    @_watcher.setTailBufferPosition @_start

module.exports = Hole
