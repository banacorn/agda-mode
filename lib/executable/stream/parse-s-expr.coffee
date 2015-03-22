{Transform} = require 'stream'
lispToArray = require 'lisp-to-array'

class ParseSExpr extends Transform

    constructor: ->
        super
            objectMode: true

    _transform: (chunk, encoding, next) ->
        @push lispToArray chunk
        next()


module.exports = ParseSExpr
