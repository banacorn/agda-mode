{View, EditorView} = require 'atom'

module.exports = class PanelView extends View

  @content: ->
    @div outlet: 'agdaPanel', class: 'agda-panel tool-panel panel-bottom', =>
      @div outlet: 'header', class: 'inset-panel padded', =>
        @span outlet: 'status'
      @div outlet: 'contentBlock', class: "block padded", =>
        @div outlet: 'content', class: 'agda-panel-content block', =>
          # @div class: "inset-panel padded", =>
          @ul outlet: 'captionList', class: 'list-group highlight'
          @ul outlet: 'contentList', class: 'list-group'

  setContent: (messages) ->
    @captionList.empty().hide()
    @contentList.empty()

    if messages.length > 0
      @contentBlock.show()

      # some responses from Agda have 2 parts
      # we'll style the two parts differently
      index = messages.indexOf('————————————————————————————————————————————————————————————')
      sectioned = index isnt -1

      if sectioned

        firstHalf = messages.slice(0, index)
        secondHalf = messages.slice(index + 1, messages.length)

        @captionList.show()

        for message in firstHalf
          @captionList.append "<li class=\"list-item caption-item\">#{message}</li>"
        for message in secondHalf
          @contentList.append "<li class=\"list-item\">#{message}</li>"

      else
        for message in messages
          @contentList.append "<li class=\"list-item\">#{message}</li>"


    else
      @contentBlock.hide()

  appendContent: (messages) ->
    if messages.length > 0
      @contentBlock.show()
      for message in messages
        @contentList.append "<li class: 'list-item'>#{message}</li>"
    else
      @contentBlock.hide()


  setStatus: (string, type) ->
    if type
      @status.attr 'class', 'text-' + type
    else
      @status.attr 'class', ''
    @status.text string

  attach: ->
    atom.workspaceView.prependToBottom @
