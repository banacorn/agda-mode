{Writable} = require 'stream'

module.exports =
  Stdout: class Stdout extends Writable
    _write: (chunk, encoding, next) ->
      console.log chunk.toString()
      next()
