{Transform} = require 'stream'

# drop wierd prefix like ((last . 1))
class Preprocess extends Transform

  constructor: ->
    super
      objectMode: true

  _transform: (chunk, encoding, next) ->

    if chunk.startsWith '((last'
      index = chunk.indexOf '(agda'
      length = chunk.length
      chunk = chunk.substring index, length - 1

    @push chunk

    next()

module.exports = Preprocess
