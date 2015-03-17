{View, TextEditorView} = require 'atom-space-pen-views'
{log, warn, error} = require '../logger'

Q = require 'Q'
_ = require 'lodash'

UNINIT = 0
HIDE = 1
OUTPUT = 2
QUERY = 3

class PanelView extends View

    mode: UNINIT
    IM: false

    @content: ->
        @div =>
            @div outlet: 'header', class: 'inset-panel padded', =>
                @span outlet: 'title'
                @span outlet: 'inputMethod'
            @div outlet: 'body', class: "block padded", =>
                @div outlet: 'content', class: 'agda-panel-content', =>
                    @ul outlet: 'contentList', class: 'list-group'
                @subview 'inputBox', new TextEditorView(mini: true, placeholderText: 'Please insert the path here')

    initialize: ->
        @switchMode HIDE
        return @

    #
    #   Modes
    #

    switchMode: (mode, callback) ->
        if mode isnt @mode
            log 'Panel', "mode: #{@mode} => #{mode}"
            switch mode
                when HIDE
                    @hide()
                    @content.hide()
                    @inputBox.hide()
                when OUTPUT
                    @show()
                    @body.show()
                    @content.show()
                    @inputBox.hide()
                when QUERY
                    @show()
                    @body.show()
                    @content.hide()
                    @inputBox.show()
                else
            callback?()
            @mode = mode


    query: ->
        @switchMode QUERY, =>
            @inputBox.focus()
            @promise = Q.Promise (resolve, reject, notify) =>
                # confirm
                @on 'core:confirm', =>
                    log 'Panel', "queried string: #{@inputBox.getText()}"
                    @hide()
                    resolve @inputBox.getText()
        return @

    output: ->
        @switchMode OUTPUT
        return @

    activateIM: ->
        if not @IM
            @IM = true
            log 'Panel', "IM on"
            @title.hide()
            @inputMethod.show()
        return @

    deactivateIM: ->
        if @IM
            @IM = false
            log 'Panel', "IM off"
            @title.show()
            @inputMethod.hide()
        return @

    #
    #   setting contents
    #

    # title
    setTitle: (content, type) ->
        content = _.escape content
        @title.text content
        if type
          @title.attr 'class', 'text-' + type
        else
          @title.attr 'class', ''
        return @

    # input method
    setInputMethod: (input, candidateKeys, candidateSymbols) ->
        @inputMethod.text "#{input}[#{candidateKeys.join('')}]"
        return @



    # placeholder of the inputbox of query mode
    setPlaceholder: (content) ->
        content = _.escape content
        @inputBox[0].getModel().placeholderText = content
        return @

    clearContent: ->
        @contentList.empty()
        @body.hide()
        return @

    setContent: (content) ->
        console.log content
        content = content.map (s) => _.escape s
        @clearContent()

        if content.length > 0
            @body.show()
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

    appendContent: (content) ->
        content = content.map (s) => _.escape s
        @body.show()
        for item in content
            @contentList.append "<li class: 'list-item'>#{item}</li>"
        return @

module.exports = PanelView
