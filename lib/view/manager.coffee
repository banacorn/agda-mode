{Point, Range} = require 'atom'
{EventEmitter} = require 'events'

PanelView = require './panel'
PathQueryView = require './path-query'

class ViewManager extends EventEmitter

  constructor: ->

    # sub views
    @panel = new PanelView
    @pathQuery = new PathQueryView

module.exports = ViewManager
