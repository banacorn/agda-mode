{View} = require 'atom'

module.exports = class PanelView extends View

  @content: ->
    @div outlet: 'agdaPanel', class: 'agda-panel tool-panel panel-bottom', =>
      @div outlet: 'header', class: 'inset-panel padded', =>
        @span outlet: 'status'
      @div outlet: 'contentBlock', class: "block padded", =>
        @div outlet: 'content', class: 'agda-panel-content block', =>
          @ul outlet: 'contentList', class: 'list-group'

  setContent: (messages) ->
    @contentList.empty()

    if messages.length > 0
      @contentBlock.show()
      for message in messages
        @contentList.append "<li class: 'list-item'>#{message}</li>"
    else
      @contentBlock.hide()

  setStatus: (string, type) ->
    if type
      @status.attr 'class', 'text-' + type
    @status.text string

  attach: ->
    atom.workspaceView.prependToBottom @
