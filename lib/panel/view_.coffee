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
                when 'title'       then @setTitle       panel.title
                when 'type'        then @setType        panel.type
                when 'content'     then @setContent     panel.content
                when 'placeholder' then @setPlaceholder panel.placeholder
        @hideAll()

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

    #
    # query: ->
    #     @switchMode QUERY, =>
    #         @inputBox.focus()
    #         @promise = Q.Promise (resolve, reject, notify) =>
    #             # confirm
    #             @on 'core:confirm', =>
    #                 log 'Panel', "queried string: #{@inputBox.getText()}"
    #                 @hide()
    #                 resolve @inputBox.getText()
    #     return @


module.exports = PanelView
