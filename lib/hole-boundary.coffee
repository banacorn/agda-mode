{EventEmitter} = require 'events'
{Point, Range} = require 'atom'

# the {! !} pair of a Hole
class HoleBoundary extends EventEmitter

  constructor: (@agda, @hole) ->
