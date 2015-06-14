_ = require 'lodash'
{log, warn, error} = require './logger'


# Handles all events coming from Agda
class Handler
    constructor: (@core) ->

    # agda2-info-action
    infoAction: (tokens) ->
        log 'Handler', 'agda2-info-action'
        # with content: ["agda2-info-action", "*Type-checking*", "Checking ...", "t"]
        # w/o  content:  ["agda2-info-action", "*Type-checking*", "nil"]
        type = tokens[1]
        content = if tokens.length is 3 then [] else _.compact tokens[2].split '\\n'

        switch type
            when '*All Goals*'
                if content.length > 0
                    @core.panelModel.set 'Goals', content, 'info'
                else
                    @core.panelModel.set 'No Goals', [], 'success'
            when '*Error*'

                # the first line with !=< we want to do cosmetic surgery with, -1 if not found
                index = _.findIndex(content, (line) -> /!=</.test line)

                if not @core.config.improveMessage() and index isnt -1
                    pre       = _.take content, index
                    expecting = 'expecting: ' + content[index].split(/!=</)[1]
                    got       = '      got: ' + content[index].split(/!=</)[0]
                    post      = _.drop content, index + 1
                    result = pre.concat([expecting, got]).concat(post)
                    @core.panelModel.set 'Error', result, 'error'
                else
                    @core.panelModel.set 'Error', content, 'error'
            when '*Type-checking*'
                @core.panelModel.set 'Type Checking', content
            when '*Current Goal*'
                @core.panelModel.set 'Current Goal', content
            when '*Inferred Type*'
                @core.panelModel.set 'Inferred Type', content
            when '*Module contents*'
                @core.panelModel.set 'Module Contents', content
            when '*Context*'
                @core.panelModel.set 'Context', content
            when '*Goal type etc.*'
                @core.panelModel.set 'Goal Type and Context', content
            when '*Normal Form*'
                @core.panelModel.set 'Normal Form', content
            when '*Intro*'
                @core.panelModel.set 'Intro', ['No introduction forms found']
            when '*Auto*'
                @core.panelModel.set 'Auto', ['No solution found']
            when '*Constraints*'
                @core.panelModel.set 'Constraints', content

    # agda2-status-action
    statusAction: (tokens) ->
        log 'Handler', 'agda2-status-action'
        if tokens.length isnt 1
            @core.panelModel.set 'Status', [tokens[1]], 'info'

    # agda2-goals-action
    goalsAction: (tokens) ->
        log 'Handler', 'agda2-goals-action'
        @core.textBuffer.onGoalsAction tokens[1]

    # agda2-goto
    goto: (tokens) ->
        log 'Handler', 'agda2-goto'
        filepath = tokens[1][0]
        position = tokens[1][2]
        @core.textBuffer.onGoto filepath, position

    # agda2-give-action
    giveAction: (tokens) ->
        log 'Handler', 'agda2-give-action'
        # with parenthesis: ["agda2-give-action", 1, "'paren"]
        # w/o  parenthesis: ["agda2-give-action", 1, "'no-paren"]
        # with content    : ["agda2-give-action", 0, ...]
        switch tokens[2]
            when "'paren"    then @core.textBuffer.onGiveAction tokens[1], [], true
            when "'no-paren" then @core.textBuffer.onGiveAction tokens[1], [], false
            else                  @core.textBuffer.onGiveAction tokens[1], tokens[2], false

    # agda2-make-case-action
    makeCaseAction: (tokens) ->
        log 'Handler', 'agda2-make-case-action'
        @core.textBuffer.onMakeCaseAction tokens[1]
            .then => @core.load()

    # agda2-highlight-clear
    highlightClear: (tokens) ->
        log 'Handler', 'agda2-highlight-clear'

    # agda2-highlight-add-annotations
    highlightAddAnnotations: (tokens) ->
        log 'Handler', 'agda2-highlight-add-annotations'
        annotations = _.rest(tokens)
        annotations.forEach (obj) =>
            result =
                start: obj[0]
                end: obj[1]
                type: obj[2]
            if obj[4]
                result.source =
                    path: obj[4][0]
                    index: obj[4][2]

            result.type.forEach (type) =>
                switch type
                    when 'unsolvedmeta', 'terminationproblem'
                        @core.highlight.highlight result

    # agda2-highlight-load-and-delete-action
    highlightLoadAndDeleteAction: (tokens) ->
        log 'Handler', 'agda2-highlight-load-and-delete-action'
        @core.textBuffer.onHighlightLoadAndDelete tokens[1]

    # agda2-parse-error
    parseError: (tokens) ->
        error 'Executable', JSON.stringify tokens

module.exports = Handler
