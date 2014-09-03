{View} = require 'atom'

module.exports = class PanelView extends View

  @content: ->
    @div class: 'tool-panel panel-bottom padded', =>
      @div class: "block", =>
        @span outlet: 'infoHeader', class: 'inline-block text-highlight'
        @span outlet: 'infoContent', class: 'inline-block'
      # @div class: "block", =>
      #   @span outlet: 'status', class: 'inline-block'

  setStatus: (type) ->
    defaultClass = 'inline-block'
    if type
      additional = 'highlight-' + type
    else
      additional = 'highlight'
    @infoHeader.attr 'class', defaultClass + ' ' + additional

  attach: ->
    atom.workspaceView.prependToBottom @
