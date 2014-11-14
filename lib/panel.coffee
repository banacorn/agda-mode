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


module.exports = Panel
