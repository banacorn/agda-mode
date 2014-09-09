{EventEmitter} = require 'events'
{Point, Range} = require 'atom'
HoleView = require './view/hole'

class Hole extends EventEmitter


  constructor: (@agda, i, headIndex, tailIndex) ->

    @index = i

    # register marker
    @setPosition @agda.editor.buffer.positionForCharacterIndex(headIndex), @agda.editor.buffer.positionForCharacterIndex(tailIndex)
    @trimMarker()
    # view
    view = new HoleView @agda, @
    view.attach()

    # text
    # @text = @agda.editor.getTextInRange @range
    # @emit 'text-changed', @text

    # view kick-off
    @emit 'position-changed', @startPosition, @endPosition


    @registerHandlers()

  # set or update
  # marker's startPosition, endPosition, range and all that
  setPosition: (startPosition, endPosition) ->

    changed = startPosition isnt @startPosition  and endPosition isnt @endPosition

    if changed
      @startPosition = startPosition
      @endPosition = endPosition
      @range = new Range startPosition, endPosition

      if @marker
        @marker.setHeadBufferPosition @endPosition
        @marker.setTailBufferPosition @startPosition
      else
        @marker = @agda.editor.markBufferRange @range, type: 'hole'

      @emit 'position-changed', @startPosition, @endPosition


  # calculate new marker range
  trimMarker: ->

    oldText = @text
    newText = @agda.editor.getTextInRange @marker.bufferMarker.getRange()

    # examine how much to trim
    left = newText.indexOf '{!'
    right = newText.length - newText.indexOf('!}') - 2

    # convert original position to character index
    start = @agda.editor.getBuffer().characterIndexForPosition @startPosition
    end = @agda.editor.getBuffer().characterIndexForPosition @endPosition

    # translate character index according to much to trim
    start += left
    end -= right

    # convert translated character index back to position
    startPosition = @agda.editor.getBuffer().positionForCharacterIndex start
    endPosition = @agda.editor.getBuffer().positionForCharacterIndex end
    # console.log left, right
    # console.log @startPosition.toArray(), @endPosition.toArray()
    # console.log startPosition.toArray(), endPosition.toArray()

    # update
    @setPosition startPosition, endPosition

  registerHandlers: ->


    @marker.on 'changed', (event) =>
      @setPosition event.newTailBufferPosition, event.newHeadBufferPosition


module.exports = Hole
