{View} = require 'atom'

module.exports = class HoleView extends View

  @content: ->
    @div 'some shit'
    
  initialize: (serializeState) ->

  # Returns an object that can be retrieved when package is activated
  serialize: ->

  # Tear down any state and detach
  destroy: ->
    @detach()
