{EventEmitter} = require 'events'
{findHoles, convertToHoles} = require './text-buffer/pure'

class TextBuffer extends EventEmitter
    constructor: (@core) ->

module.exports = TextBuffer
