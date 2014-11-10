{EventEmitter} = require 'events'
{findHoles, convertToHoles} = require './text-buffer/pure'
Goal = require './text-buffer/goal'

class TextBuffer extends EventEmitter
    constructor: (@core) ->

    setGoals: (indices) ->

module.exports = TextBuffer
