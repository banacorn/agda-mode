{View, TextEditorView} = require 'atom-space-pen-views'
{log, warn, error} = require '../logger'
{QueryCancelledError} = require '../error'

_ = require 'lodash'

class PanelView extends View

    @content: ->
        @div =>
            @div outlet: 'head', id: 'head', class: 'inset-panel padded', =>
                @div outlet: 'title'
                @div outlet: 'inputMethod', id: 'input-method'
            @div outlet: 'body', class: "block padded", =>
                @div outlet: 'content', class: 'agda-panel-content native-key-bindings', tabindex: "-1", =>
                    @ul outlet: 'contentList', class: 'list-group'
                @subview 'inputBox', new TextEditorView mini: true

    initialize: ->
        atom.commands.add 'atom-text-editor',
            'core:confirm': =>
                if @model.queryPromise
                    log 'Panel', "queried string: #{@inputBox.getText()}"
                    @model.queryString = @inputBox.getText().trim()
                    @inputBox.hide()
                    @model.resolveQuery()
                    atom.views.getView(atom.workspace.getActiveTextEditor()).focus()
            'core:cancel': =>
                if @model.queryPromise
                    @cancelQuery()
                    @model.rejectQuery()

    hideAll: ->
        @head.hide()
        @title.hide()
        @inputMethod.hide()
        @body.hide()
        @content.hide()
        @inputBox.hide()

    setModel: (@model) ->
        log 'Panel', 'Setting Panel Model'
        Object.observe @model, (changes) => changes.forEach (change) =>
            switch change.name
                when 'title'            then @setTitle()
                when 'type'             then @setType()
                when 'content'          then @setContent()
                when 'placeholder'      then @setPlaceholder()
                when 'queryPromise'
                    @query() if change.type is 'add'
                when 'inputMethodOn'    then @activateInputMethod()
                when 'inputMethod'      then @setInputMethod()
        @hideAll()

    ############################################################################




    ############################################################################

    # title
    setTitle: ->
        content = _.escape @model.title
        @title.text content

        @head.show()
        @title.show()

    setType: ->
        @title.attr 'class', 'text-' + @model.type

    setPlaceholder: ->
        content = _.escape @model.placeholder
        @inputBox[0].getModel().placeholderText = content

    setContent: ->
        content = @model.content.map (s) => _.escape s
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
        if @model.inputMethodOn
            @title.hide()
            @inputMethod.show()
        else
            @title.show()
            @inputMethod.hide()


    setInputMethod: ->
        @inputMethod.text "#{@model.inputMethod.input}"
        @model.inputMethod.candidateKeys.forEach (key) =>
            @inputMethod.append "<kbd class='key-binding'>#{key}</kbd>"

        # @inputMethod.text "#{@model.inputMethod.input}[#{@model.inputMethod.candidateKeys.join('')}][#{@model.inputMethod.candidateSymbols.join(', ')}]"


    query: ->
        log 'Panel', 'querying ...'
        @head.show()
        @body.show()
        @inputBox.show()
        @inputBox.focus()

    cancelQuery: ->
        log 'Panel', 'stop querying'
        @inputBox.hide()
        atom.views.getView(atom.workspace.getActiveTextEditor()).focus()


module.exports = PanelView
