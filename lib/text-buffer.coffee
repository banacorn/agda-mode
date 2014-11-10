{EventEmitter} = require 'events'

class TextBuffer extends EventEmitter
    constructor: (@core) ->

module.exports = TextBuffer
