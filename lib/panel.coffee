{EventEmitter} = require 'events'

QueryExecutablePath = require './panel/query-executable-path'
OutputPanel = require './panel/output'

class Panel extends EventEmitter
    queryExecutablePath: QueryExecutablePath

    constructor: ->
        @view = new PanelView

    infoAction: (obj) ->
        switch obj.type
            when '*All Goals*'
                @view
                    .setTitle 'All Goals', 'info'
                    .setList obj.content
            when '*Type-checking*'
                @view
                    .setTitle 'Type Checking'
                    .setList obj.content


module.exports = Panel
