{Range} = require 'atom'

class Highlight
    markers: []
    constructor: (@core) ->

    highlight: (obj) ->
        start = @core.editor.getBuffer().positionForCharacterIndex obj.start - 1
        end   = @core.editor.getBuffer().positionForCharacterIndex obj.end - 1
        range = new Range start, end
        marker = @core.editor.markBufferRange range
        @markers.push marker
        decorator = @core.editor.decorateMarker marker,
            type: 'highlight'
            class: "agda-highlight #{obj.type}"

    destroyAllMarker: ->
        @markers.forEach (marker) -> marker.destroy()

module.exports = Highlight
