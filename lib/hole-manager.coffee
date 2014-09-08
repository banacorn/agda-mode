{EventEmitter} = require 'events'
{Point, Range} = require 'atom'
Hole = require './hole'

# manages all "holes" in a editor
class HoleManager extends EventEmitter

  holes: []

  constructor: (@agda) ->
    @destroyAllHoleMarkers()

    text = @agda.editor.getText()
    headIndices = @indicesOf text, /\{!/
    tailIndices = @indicesOf text, /!\}/

    # register all markers first
    for headIndex, i in headIndices

      tailIndex = tailIndices[i]

      # length of '!}'
      tailIndex += 2
      
      @holes.push new Hole @agda, i, headIndex, tailIndex

    @agda.editor.cursors[0].on 'moved', (event) =>
      @holes.map (hole) => hole.skip event

  destroyAllHoleMarkers: ->
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

module.exports = HoleManager
