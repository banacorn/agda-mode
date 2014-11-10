{EventEmitter} = require 'events'
{resizeHoles, findHoles, convertToHoles} = require './text-buffer/pure'
Goal = require './text-buffer/goal'

class TextBuffer extends EventEmitter
    constructor: (@core) ->

    setGoals: (indices) ->

        textRaw     = @core.editor.getText()            # get raw text
        textBracket = convertToHoles textRaw            #   ?  => {!!}
        text        = resizeHoles textBracket, indices  # {!!} => {!  !}
        @core.editor.setText text

        positions   = findHoles text
        positions.forEach (pos, i) =>
            index = indices[i]
            goal  = new Goal @core, index, pos.start, pos.end - 2



module.exports = TextBuffer
