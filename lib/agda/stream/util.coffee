{Transform, Readable} = require 'stream'

# make a list source of a stream
class ListSource extends Readable

  constructor: (@list) ->
    super
      objectMode: true

  _read: ->
    for l in @list
      @push l
    @push null

# for logging purpose, log to stdout if not specified
class Log extends Transform
  constructor: (@dest) ->
    @dest ?= (str) -> console.log str
    super
      objectMode: true

  _transform: (chunk, encoding, next) ->
    @dest chunk
    @push chunk
    next()

module.exports =
  ListSource: ListSource
  Log: Log
