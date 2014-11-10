{EventEmitter} = require 'events'

PanelView = require './panel/view'

class Panel extends EventEmitter
    
    constructor: ->
        @view = new PanelView

    queryExecutablePath: ->
        @view.query()
            .setTitle 'Given path of Agda executable not found, try "which agda" in your terminal'
            .setPlaceholder 'Please insert the path here'

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


module.exports = Panel
