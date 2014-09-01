{Writable} = require 'stream'

module.exports =
  Stdout: class Stdout extends Writable

    constructor: ->
      super
        objectMode: true
    _write: (chunk, encoding, next) ->
      console.log chunk
      next()
