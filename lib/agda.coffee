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
      @syntax.activate()
    else
      @restart()


  quit: ->
    if @loaded
      @loaded = false
      @syntax.deactivate()


  restart: ->
    @quit()
    @load()
