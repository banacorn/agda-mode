{Point, Range} = require 'atom'
{EventEmitter} = require 'events'

PanelView = require './panel'
PathQueryView = require './path-query'

class ViewManager extends EventEmitter

  attachedView: null

  constructor: ->

    # sub views
    @panel = new PanelView
    @pathQuery = new PathQueryView

  queryPath: (callback) -> @pathQuery.query callback

  attachPanel: -> @attach 'panel'

  #
  #   attach & detach
  #

  attach: (view) ->
    @detach()
    @attachedView = @[view]
    @attachedView.attach()

  detach: ->
    if @attachedView isnt null
      @attachedView.detach()


module.exports = ViewManager
