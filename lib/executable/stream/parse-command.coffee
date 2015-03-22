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
                    @executable.emit 'info-action', tokens[1][1], []
                else
                    @executable.emit 'info-action', tokens[1][1], _.compact tokens[2][1].split '\\n'

            when 'agda2-status-action'
                if tokens.length is 1
                    # ["agda2-status-action"]
                    @executable.emit 'status-action', []
                else
                    # ["agda2-status-action", Array[2]]
                    @executable.emit 'status-action', tokens[1]

            when 'agda2-goals-action'
                # ["agda2-goals-action", ['.', 0, 1, 2, 3]]
                tokens[1].shift()
                @executable.emit 'goals-action', tokens[1]

            when 'agda2-goto'
                # ["agda2-goto", ["number", Array[2], ".", 94]]
                @executable.emit 'goto', tokens[1][1][1], tokens[1][3]

            when 'agda2-give-action'
                # with parenthesis: ["agda2-give-action", 1, "'paren"]
                # w/o  parenthesis: ["agda2-give-action", 1, "'no-paren"]
                # with content    : ["agda2-give-action", 0, Array[2]]
                if tokens[2] instanceof Array
                    @executable.emit 'give-action', tokens[1], tokens[2][1], false
                else
                    @executable.emit 'give-action', tokens[1], [], tokens[2] is "'paren"

            when 'agda2-make-case-action'
                # ["agda2-make-case-action", Array[3]]
                tokens[1].shift()
                content = tokens[1].map (x) => x[1]
                @executable.emit 'make-case-action', content

            #
            #   highlighting shit
            #

            when 'agda2-highlight-clear'
                @executable.emit 'highlight-clear'

            when 'agda2-highlight-add-annotations'
                @executable.emit 'highlight-add-annotations'

            when 'agda2-highlight-load-and-delete-action'
                @executable.emit 'highlight-load-and-delete-action', tokens[1][1]

            #
            #   Agda cannot read our input
            #

            when 'cannot'
                @executable.emit 'agda executable cannot read', JSON.stringify tokens
            else
                @executable.emit 'parser error', JSON.stringify tokens
        next()
module.exports = ParseCommand
