{Transform} = require 'stream'

# drop wierd prefix like ((last . 1))
# and make it friendly to 'lisp-to-array' package
class Preprocess extends Transform

    constructor: ->
        super
            objectMode: true

    _transform: (chunk, encoding, next) ->

        if chunk.startsWith '((last'
            # drop wierd prefix
            index = chunk.indexOf '(agda'
            length = chunk.length
            chunk = chunk.substring index, length - 1

            chunk = chunk.replace /'\(/g, '(number '
            chunk = chunk.replace /\("/g, '(string "'

            @push chunk

            next()

module.exports = Preprocess
