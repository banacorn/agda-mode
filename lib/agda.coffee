AgdaSyntax = require './agda/syntax'
AgdaPathQueryView = require './agda/path-query-view'
AgdaInteractive = require './agda/interactive'

module.exports = class Agda

  executablePath: null
  loaded: false

  constructor: (@editor) ->

    @syntax = new AgdaSyntax @editor
    @syntax.deactivate()

    filepath = @editor.getPath()
    @interactive = new AgdaInteractive filepath

    @registerHandlers()

  registerHandlers: ->

    @interactive.on 'wired', =>
      @loaded = true
      @syntax.activate()
      @interactive.load()

  load: ->
    if not @loaded
      @interactive.wire()
    else
      @restart()


  quit: ->
    if @loaded
      @loaded = false
      @syntax.deactivate()
      @interactive.quit()

  restart: ->
    @quit()
    @load()
