{EventEmitter} = require 'events'

PanelView = require './panel/view'

class Panel extends EventEmitter

    constructor: ->
        @view = new PanelView

    hide: -> @view.detach()
    show: -> @view.attach()

    queryExecutablePath: ->
        @view.query()
            .setTitle 'Given path of Agda executable not found, try "which agda" in your terminal'
            .setPlaceholder 'Please insert the path here'

    queryExpression: ->
        @view.query()
            .setTitle 'Normalize expression'
            .setPlaceholder 'Expression here'

    output: (title, type, content) ->
        @view.output()
            .setTitle title, type
            .setContent content

    outputInfo: (content) ->
        @view.output()
            .setTitle 'Info'
            .setContent [content]


    infoAction: (obj) ->
        switch obj.type
            when '*All Goals*'
                if obj.content.length > 0
                    @view
                        .output()
                        .setTitle 'All Goals', 'info'
                        .setContent obj.content
                else
                    @view
                        .output()
                        .setTitle 'No Goals', 'info'
                        .setContent []
            when '*Error*'
                @view
                    .output()
                    .setTitle 'Error', 'error'
                    .setContent obj.content
            when '*Type-checking*'
                @view
                    .output()
                    .setTitle 'Type Checking'
                    .setContent obj.content
            when '*Current Goal*'
                @view
                    .output()
                    .setTitle 'Current Goal'
                    .setContent obj.content
            when '*Context*'
                @view
                    .output()
                    .setTitle 'Context'
                    .setContent obj.content
            when '*Goal type etc.*'
                @view
                    .output()
                    .setTitle 'Goal Type and Context'
                    .setContent obj.content
            when '*Normal Form*'
                @view
                    .output()
                    .setTitle 'Normal Form'
                    .setContent obj.content
            when '*Intro*'
                @view
                    .output()
                    .setTitle 'Intro'
                    .setContent ['No introduction forms found']
            when '*Auto*'
                @view
                    .output()
                    .setTitle 'Auto'
                    .setContent ['No solution found']

    #
    #   Input Method
    #
    #   On activating input method, input suggestions will be displayed at
    #   PanelView.header, we should recover what was there after the input
    #   method is deactivated

    activateIM: (input, candidateKeys, candidateSymbols) ->
        @view.activateIM()
            .setInputMethod input, candidateKeys, candidateSymbols

    deactivateIM: ->
        @view.deactivateIM()

module.exports = Panel
