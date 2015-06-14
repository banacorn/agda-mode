{Transform} = require 'stream'
_ = require 'lodash'
{log, warn, error} = require './../../logger'

class ParseCommand extends Transform

    constructor: (@executable) ->
        super
            objectMode: true

    _transform: (tokens, encoding, next) ->
        switch tokens[0]

            when 'agda2-info-action'
                # with content: ["agda2-info-action", "*Type-checking*", "Checking ...", "t"]
                # w/o  content:  ["agda2-info-action", "*Type-checking*", "nil"]
                if tokens.length is 3
                    @executable.onInfoAction tokens[1], []
                else
                    @executable.onInfoAction tokens[1], _.compact tokens[2].split '\\n'

            when 'agda2-status-action'
                if tokens.length is 1
                    @executable.onStatusAction []
                else
                    @executable.onStatusAction [tokens[1]]

            when 'agda2-goals-action'
                @executable.onGoalsAction tokens[1]

            when 'agda2-goto'
                @executable.onGoto tokens[1][0], tokens[1][2]

            when 'agda2-give-action'
                # with parenthesis: ["agda2-give-action", 1, "'paren"]
                # w/o  parenthesis: ["agda2-give-action", 1, "'no-paren"]
                # with content    : ["agda2-give-action", 0, ...]
                switch tokens[2]
                    when "'paren"    then @executable.onGiveAction tokens[1], [], true
                    when "'no-paren" then @executable.onGiveAction tokens[1], [], false
                    else @executable.onGiveAction tokens[1], tokens[2], false

            when 'agda2-make-case-action'
                @executable.onMakeCaseAction tokens[1]

            #
            #   highlighting shit
            #

            # when 'agda2-highlight-clear'
            #     @executable.emit 'highlight-clear'

            when 'agda2-highlight-add-annotations'
                _.rest(tokens).forEach (obj) =>
                    result =
                        start: obj[0]
                        end: obj[1]
                        type: obj[2]
                    if obj[4]
                        result.source =
                            path: obj[4][0]
                            index: obj[4][2]
                    @executable.onHighlightAddAnnotations result

            when 'agda2-highlight-load-and-delete-action'
                @executable.onHighlightLoadAndDeleteAction tokens[1]

            #
            #   Agda cannot read our input
            #

            when 'agda2-parse-error'
                @executable.onParseError JSON.stringify tokens
            else
                error 'Parser', tokens.toString()
        next()
module.exports = ParseCommand
