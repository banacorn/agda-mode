{EventEmitter} = require 'events'
{Point, Range} = require 'atom'
Hole = require './hole'

# manages all "holes" in a editor
class HoleManager extends EventEmitter

  holes: []

  constructor: (@agda) ->
    @destroyMarkers()
    @expandBoundaries()

    text = @agda.editor.getText()
    headIndices = @indicesOf text, /\{!/
    tailIndices = @indicesOf text, /!\}/

    # register all markers first
    for headIndex, i in headIndices

      tailIndex = tailIndices[i]

      # length of '!}' and hole index
      tailIndex += 2
      @holes.push new Hole(@agda, i, headIndex, tailIndex)

    @agda.on 'quit', @destroyMarkers

  # convert all '?' to '{!!}'
  expandBoundaries: ->
    rawText = @agda.editor.getText()
    convertSpaced = rawText.split(' ? ').join(' {!  !} ')
    convertNewlined = convertSpaced.split(' ?\n').join(' {!  !}\n')
    @agda.editor.setText convertNewlined

  destroyMarkers: =>
    # first, destroy all Holes
    @holes.forEach (hole) => hole.emit 'destroyed'
    # second, destroy wandering markers
    markers = @agda.editor.findMarkers type: 'hole'
    markers.map (marker) => marker.destroy()

  indicesOf: (string, pattern) ->
    indices = []
    cursor = 0
    result = string.match pattern
    while result
      indices.push result.index + cursor
      cursor += result.index + result[0].length
      string = string.substr (result.index + result[0].length)
      result = string.match pattern
    return indices

  findHole: (index) ->
    holes = @holes.filter (hole) => hole.index is index
    return holes[0]

  destroyHole: (index) ->
    @holes.filter (hole, i) =>
      hole.index is index
      hole.destroy()
      @holes.splice i, 1

module.exports = HoleManager
