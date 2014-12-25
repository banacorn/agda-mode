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

    outputInfo: (content) ->
        @view.output()
            .setTitle 'Info'
            .setList [content]

    infoAction: (obj) ->
        switch obj.type
            when '*All Goals*'
                @view
                    .output()
                    .setTitle 'All Goals', 'info'
                    .setList obj.content
            when '*Type-checking*'
                @view
                    .output()
                    .setTitle 'Type Checking'
                    .setList obj.content
            when '*Current Goal*'
                @view
                    .output()
                    .setTitle 'Current Goal'
                    .setList obj.content
            when '*Context*'
                @view
                    .output()
                    .setTitle 'Context'
                    .setList obj.content
            when '*Goal type etc.*'
                @view
                    .output()
                    .setTitle 'Goal Type and Context'
                    .setList obj.content
            when '*Normal Form*'
                @view
                    .output()
                    .setTitle 'Normal Form'
                    .setList obj.content

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
