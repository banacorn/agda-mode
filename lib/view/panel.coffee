{View} = require 'atom'

module.exports = class PanelView extends View

  @content: ->
    @div outlet: 'agdaPanel', class: 'agda-panel tool-panel panel-bottom', =>
      @div outlet: 'header', class: 'inset-panel padded', =>
        @span outlet: 'status'
      @div class: "block padded", =>
        @div outlet: 'content', class: 'agda-panel-content block', =>
          @ul class: 'list-group'

  addInfoContent: (string) ->
    @content.find 'ul'
      .append "<li class: 'list-item'>#{string}</li>"

  setStatus: (string, type) ->
    if type
      @status.attr 'class', 'text-' + type
    @status.text string

  attach: ->
    atom.workspaceView.prependToBottom @
