{View, EditorView} = require 'atom'

Q = require 'Q'

class PanelView extends View

    @content: ->
        @div outlet: 'agdaPanel', class: 'agda-panel tool-panel panel-bottom', =>
            @div outlet: 'header', class: 'inset-panel padded', =>
                @span outlet: 'title'
            @div outlet: 'contentBlock', class: "block padded", =>
                @div outlet: 'content', class: 'agda-panel-content block', =>
                    @ul outlet: 'captionList', class: 'list-group highlight'
                    @ul outlet: 'contentList', class: 'list-group'

    initialize: ->
        atom.workspaceView.prependToBottom @
        return @

    setTitle: (content, type) ->
        @title.text content
        if type
          @title.attr 'class', 'text-' + type
        else
          @title.attr 'class', ''

        return @

    clearList: ->
        @contentList.empty()
        return @

    setList: (content) ->
        @clearList()

        if content.length > 0

            # some responses from Agda have 2 parts
            # we'll style these two parts differently
            index = content.indexOf('————————————————————————————————————————————————————————————')
            sectioned = index isnt -1

            if sectioned

                firstHalf = content.slice(0, index)
                secondHalf = content.slice(index + 1, messages.length)

                for item in firstHalf
                    @captionList.append "<li class=\"list-item caption-item\">#{item}</li>"
                for item in secondHalf
                    @contentList.append "<li class=\"list-item\">#{item}</li>"

            else
                for item in content
                    @contentList.append "<li class=\"list-item\">#{item}</li>"
        return @

    appendList: (content) ->
        for item in content
            @contentList.append "<li class: 'list-item'>#{item}</li>"
        return @

module.exports = PanelView
