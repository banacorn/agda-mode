{Point, Range} = require 'atom'
{EventEmitter} = require 'events'

PanelView = require './panel'
PathQueryView = require './path-query'
InputBoxView = require './input-box'

class ViewManager extends EventEmitter

  attachedView: null

  constructor: ->

    # sub views
    @panel = new PanelView
    @pathQuery = new PathQueryView
    @inputBox = new InputBoxView

  attachInputBox:  (callback) -> @attach 'inputBox', callback
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
      # put the focus back to the current view
      atom.workspaceView.focus()


module.exports = ViewManager
