{Transform} = require 'stream'
_ = require 'lodash'

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
                    @executable.emit 'info-action', tokens[1], []
                else
                    @executable.emit 'info-action', tokens[1], _.compact tokens[2].split '\\n'

            when 'agda2-status-action'
                if tokens.length is 1
                    @executable.emit 'status-action', []
                else
                    @executable.emit 'status-action', [tokens[1]]

            when 'agda2-goals-action'
                @executable.emit 'goals-action', tokens[1]

            when 'agda2-goto'
                @executable.emit 'goto', tokens[1][0], tokens[1][2]

            when 'agda2-give-action'
                # with parenthesis: ["agda2-give-action", 1, "'paren"]
                # w/o  parenthesis: ["agda2-give-action", 1, "'no-paren"]
                # with content    : ["agda2-give-action", 0, ...]
                switch tokens[2]
                    when "'paren" then @executable.emit 'give-action', tokens[1], [], true
                    when "'no-paren" then @executable.emit 'give-action', tokens[1], [], false
                    else @executable.emit 'give-action', tokens[1], tokens[2], false

            when 'agda2-make-case-action'
                @executable.emit 'make-case-action', tokens[1]

            #
            #   highlighting shit
            #

            when 'agda2-highlight-clear'
                @executable.emit 'highlight-clear'

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
                    @executable.emit 'highlight-add-annotations', result
                    
            when 'agda2-highlight-load-and-delete-action'
                @executable.emit 'highlight-load-and-delete-action', tokens[1]

            #
            #   Agda cannot read our input
            #

            when 'agda2-parse-error'
                @executable.emit 'parse-error', JSON.stringify tokens
            else
                @executable.emit 'what the fuck?', JSON.stringify tokens
        next()
module.exports = ParseCommand
