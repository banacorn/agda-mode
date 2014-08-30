AgdaSyntax = require './agda-syntax'

module.exports = class Agda

  executablePath: null
  loaded: false

  constructor: (@editor) ->
    console.log 'initialized'

    @syntax = new AgdaSyntax @editor

    @syntax.deactivate()

  load: ->
    if not @loaded
      @loaded = true
      console.log 'loaded', @loaded
      @syntax.activate()
    else
      console.log 'reload'

  quit: ->
    if @loaded
      @loaded = false
      console.log 'loaded', @loaded
      @syntax.deactivate()
    else
      console.log 'not loaded'
