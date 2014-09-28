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

  attachPathQuery: (callback) -> @attach 'pathQuery', callback
  attachPanel:                -> @attach 'panel'

  #
  #   attach & detach
  #

  attach: (view, callback) ->
    @detach()
    @attachedView = @[view]

    if callback
      @attachedView.attach callback
    else
      @attachedView.attach()

  detach: ->
    if @attachedView isnt null
      @attachedView.detach()


module.exports = ViewManager
