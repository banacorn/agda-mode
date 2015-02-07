{Transform} = require 'stream'
_ = require 'lodash'

class ParseCommand extends Transform

    constructor: (@executable) ->
        super
            objectMode: true

    _transform: (tokens, encoding, next) ->

        switch tokens[0]

            when 'agda2-info-action'
                content = _.compact tokens[2].split '\\n'
                @executable.emit 'info-action',
                    type: tokens[1],
                    content: content

            when 'agda2-status-action' then @executable.emit 'status-action',
                status: tokens[1]

            when 'agda2-goals-action' then @executable.emit 'goals-action',
                goals: tokens[1]

            when 'agda2-goto' then @executable.emit 'goto',
                filepath: tokens[1][0]
                position: tokens[1][2]

            when 'agda2-give-action' then @executable.emit 'give-action',
                goalIndex: tokens[1]
                content: if typeof tokens[2] is 'string' then tokens[2] else null

            when 'agda2-make-case-action' then @executable.emit 'make-case-action',
                content: tokens[1]

            #
            #   highlighting shit
            #

            when 'agda2-highlight-clear'
                @executable.emit 'highlight-clear'

            when 'agda2-highlight-add-annotations'
                @executable.emit 'highlight-add-annotations'

            when 'agda2-highlight-load-and-delete-action'
                @executable.emit 'highlight-load-and-delete-action',
                    filepath: tokens[1]

            #
            #   Agda cannot read our input
            #

            when 'annot'
                @executable.emit 'agda executable cannot read', JSON.stringify tokens
            else
                @executable.emit 'parser error', JSON.stringify tokens
        next()
module.exports = ParseCommand
