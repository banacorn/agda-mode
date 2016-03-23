{Transform} = require 'stream'
_ = require 'lodash'

class ParseCommand extends Transform

    constructor: (@core) ->
        super
            objectMode: true

    _transform: (tokens, encoding, next) ->
        #  if there's error:
        #   1. empty the command queue
        #   2. release the history checkpoing lock
        if tokens[0] is "agda2-info-action" and tokens[1] is "*Error*"
            @core.commander.emptyCommandQueue()
            @core.commander.commandEnd()
        else
            @core.commander.maintainCommandQueue(tokens[0])
        switch tokens[0]
            when 'agda2-info-action'    then @core.handler.infoAction tokens
            when 'agda2-status-action'  then @core.handler.statusAction tokens
            when 'agda2-goals-action'   then @core.handler.goalsAction tokens
            when 'agda2-give-action'    then @core.handler.giveAction tokens
            when 'agda2-parse-error'    then @core.handler.parseError tokens
            when 'agda2-goto', 'agda2-maybe-goto'
                @core.handler.goto tokens
            when 'agda2-solveAll-action'
                @core.handler.solveAllAction tokens
            when 'agda2-make-case-action'
                @core.handler.makeCaseAction tokens
            when 'agda2-make-case-action-extendlam'
                @core.handler.makeCaseActionExtendLam tokens
            when 'agda2-highlight-clear'
                @core.handler.highlightClear tokens
            when 'agda2-highlight-add-annotations'
                @core.handler.highlightAddAnnotations tokens
            when 'agda2-highlight-load-and-delete-action'
                @core.handler.highlightLoadAndDeleteAction tokens
            else
                console.error 'Parser', tokens.toString()
        next()
module.exports = ParseCommand
