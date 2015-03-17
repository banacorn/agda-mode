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

    setModel: (@panel) ->
        log 'Panel', 'Setting Panel Model'
        Object.observe @panel, (changes) => changes.forEach (change) =>
            switch change.name
                when 'title'            then @setTitle()
                when 'type'             then @setType()
                when 'content'          then @setContent()
                when 'placeholder'      then @setPlaceholder()
                when 'queryOn'          then @query()
                when 'inputMethodOn'    then @activateInputMethod()
                when 'inputMethod'      then @setInputMethod()
        @hideAll()

    ############################################################################




    ############################################################################

    # title
    setTitle: ->
        content = _.escape @panel.title
        @title.text content

        @head.show()
        @title.show()

    setType: ->
        @title.attr 'class', 'text-' + @panel.type

    setPlaceholder: ->
        content = _.escape @panel.placeholder
        @inputBox[0].getModel().placeholderText = content

    setContent: ->
        content = @panel.content.map (s) => _.escape s
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


    activateInputMethod: ->
        console.log @panel.inputMethodOn
        if @panel.inputMethodOn
            @title.hide()
            @inputMethod.show()
        else
            @title.show()
            @inputMethod.hide()


    setInputMethod: ->
        @inputMethod.text "#{@panel.inputMethod.input}[#{@panel.inputMethod.candidateKeys.join('')}]"


    query: -> if @panel.queryOn
        @head.show()
        @body.show()
        @inputBox.show()
        @inputBox.focus()
        @on 'core:confirm', =>
            log 'Panel', "queried string: #{@inputBox.getText()}"
            @panel.queryString = @inputBox.getText()
            @inputBox.hide()



module.exports = PanelView
