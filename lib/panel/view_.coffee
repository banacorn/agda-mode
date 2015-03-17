{View, TextEditorView} = require 'atom-space-pen-views'
{log, warn, error} = require '../logger'

Q = require 'Q'
_ = require 'lodash'

class PanelView extends View

    @content: ->
        @div =>
            @div outlet: 'head', class: 'inset-panel padded', =>
                @span outlet: 'title'
                @span outlet: 'inputMethod'
            @div outlet: 'body', class: "block padded", =>
                @div outlet: 'content', class: 'agda-panel-content', =>
                    @ul outlet: 'contentList', class: 'list-group'
                @subview 'inputBox', new TextEditorView mini: true

    hideAll: ->
        @head.hide()
        @title.hide()
        @inputMethod.hide()
        @body.hide()
        @content.hide()
        @inputBox.hide()

    setModel: (panel) ->
        log 'Panel', 'Setting Panel Model'
        Object.observe panel, (changes) => changes.forEach (change) =>
            switch change.name
                when 'title'        then @setTitle       panel.title
                when 'type'         then @setType        panel.type
                when 'content'      then @setContent     panel.content
                when 'placeholder'  then @setPlaceholder panel.placeholder
                when 'query'        then @query()
        @hideAll()

        panel.on 'query', => @query panel


    ############################################################################




    ############################################################################

    # title
    setTitle: (content) ->
        content = _.escape content
        @title.text content

        @head.show()
        @title.show()

    setType: (type) ->
        @title.attr 'class', 'text-' + type

    setPlaceholder: (content) ->
        content = _.escape content
        @inputBox[0].getModel().placeholderText = content
        return @

    setContent: (content) ->
        content = content.map (s) => _.escape s
        @contentList.empty()

        if content.length > 0
            @body.show()
            @content.show()
            # some responses from Agda have 2 parts
            # we'll style these two parts differently
            index = content.indexOf('————————————————————————————————————————————————————————————')
            sectioned = index isnt -1
            if sectioned

                firstHalf = content.slice(0, index)
                secondHalf = content.slice(index + 1, content.length)

                for item in firstHalf
                    @contentList.append "<li class=\"list-item text-info\">#{item}</li>"
                for item in secondHalf
                    @contentList.append "<li class=\"list-item\">#{item}</li>"

            else
                for item in content
                    @contentList.append "<li class=\"list-item\">#{item}</li>"
        else
            @body.hide()
        return @


    query: (panel) ->
        @head.show()
        @body.show()
        @inputBox.show()
        @inputBox.focus()
        @on 'core:confirm', =>
            log 'Panel', "queried string: #{@inputBox.getText()}"
            panel.emit 'reply', @inputBox.getText()
            @inputBox.hide()



module.exports = PanelView
