{Transform} = require 'stream'
_ = require 'lodash'

class ParseCommand extends Transform

    constructor: (@executable) ->
        super
            objectMode: true

    _transform: (tokens, encoding, next) ->
        switch tokens[0]

            when 'agda2-info-action'
                # with content: ["agda2-info-action", Array[2], Array[2], "t"]
                # w/o  content: ["agda2-info-action", Array[2], "nil"]
                if tokens.length is 3
                    @executable.emit 'info-action',
                        type: tokens[1][1],
                        content: []
                else
                    @executable.emit 'info-action',
                        type: tokens[1][1],
                        content: _.compact tokens[2][1].split '\\n'

            when 'agda2-status-action'
                # ["agda2-status-action"]
                if tokens.length is 1
                    @executable.emit 'status-action',
                        status: []
                # ["agda2-status-action", Array[2]]
                else
                    @executable.emit 'status-action',
                        status: tokens[1]

            when 'agda2-goals-action'
                # ["agda2-goals-action", ['.', 0, 1, 2, 3]]
                tokens[1].shift()
                @executable.emit 'goals-action',
                    goals: tokens[1]

            when 'agda2-goto'
                # ["agda2-goto", ["number", Array[2], ".", 94]]
                @executable.emit 'goto',
                    filepath: tokens[1][1][1]
                    position: tokens[1][3]

            when 'agda2-give-action'
                # with parenthesis: ["agda2-give-action", 1, "'paren"]
                # w/o  parenthesis: ["agda2-give-action", 1, "'no-paren"]
                # with content    : ["agda2-give-action", 0, Array[2]]
                if tokens[2] instanceof Array
                    @executable.emit 'give-action',
                        goalIndex: tokens[1]
                        content: tokens[2][1]
                        paran: false
                else
                    @executable.emit 'give-action',
                        goalIndex: tokens[1]
                        content: null
                        paran: tokens[2] is "'paren"

            when 'agda2-make-case-action'
                # ["agda2-make-case-action", Array[3]]
                tokens[1].shift()
                content = tokens[1].map (x) => x[1]
                @executable.emit 'make-case-action',
                    content: content

            #
            #   highlighting shit
            #

            when 'agda2-highlight-clear'
                @executable.emit 'highlight-clear'

            when 'agda2-highlight-add-annotations'
                @executable.emit 'highlight-add-annotations'

            when 'agda2-highlight-load-and-delete-action'
                @executable.emit 'highlight-load-and-delete-action',
                    filepath: tokens[1][1]

            #
            #   Agda cannot read our input
            #

            when 'annot'
                @executable.emit 'agda executable cannot read', JSON.stringify tokens
            else
                @executable.emit 'parser error', JSON.stringify tokens
        next()
module.exports = ParseCommand
