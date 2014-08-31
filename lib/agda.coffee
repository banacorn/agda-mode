AgdaSyntax = require './agda-syntax'
AgdaPathQueryView = require './agda-path-query-view'

module.exports = class Agda

  executablePath: null
  loaded: false

  constructor: (@editor) ->

    @syntax = new AgdaSyntax @editor
    @syntax.deactivate()

    @queryExecutablePath()

  queryExecutablePath: ->
    @pathQueryView = new AgdaPathQueryView

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
