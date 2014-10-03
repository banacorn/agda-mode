{Point, Range} = require 'atom'
{EventEmitter} = require 'events'

PanelView = require './panel'
PathQueryView = require './path-query'
InputBoxView = require './input-box'
InputMethodView = require './input-method'

class ViewManager extends EventEmitter

  attachedView: []

  constructor: ->

    # sub views
    @panel = new PanelView
    @pathQuery = new PathQueryView
    @inputBox = new InputBoxView
    @inputMethod = new InputMethodView

  attachInputBox:  (callback) -> @attach 'inputBox', callback
  attachPathQuery: (callback) -> @attach 'pathQuery', callback
  attachPanel:                -> @attach 'panel'

  # we shall not detach other views then invoking input method
  # so we won't apply it to @attach (since it will detach all the other views first)
  attachInputMethod: (callback) ->
    @inputMethod.attach()
    @attachedView.push @inputMethod

  detachInputMethod: -> @inputMethod.detach()

  #
  #   attach & detach
  #

  attach: (viewName, callback) ->
    @detach()

    view = @[viewName]

    @attachedView.push view

    if callback
      view.attach callback
    else
      view.attach()

  detach: ->
    @attachedView.forEach (view) ->
      view.detach()
    # put the focus back to the current view
    atom.workspaceView.focus()


module.exports = ViewManager
