{EventEmitter} = require 'events'

QueryExecutablePath = require './panel/query-executable-path'
OutputPanel = require './panel/output'

class Panel extends EventEmitter
    queryExecutablePath: QueryExecutablePath

    constructor: ->
        @output = new OutputPanel

    infoAction: (obj) ->
        switch obj.type
            when '*All Goals*'
                @output
                    .setTitle 'All Goals', 'info'
                    .setList obj.content
            when '*Type-checking*'
                @output
                    .setTitle 'Type Checking'
                    .setList obj.content


module.exports = Panel
