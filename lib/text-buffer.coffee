fs              = require 'fs'
_               = require 'lodash'
{Point, Range}  = require 'atom'
Promise         = require 'bluebird'

{getHoles}          = require './text-buffer/hole'
Goal                = require './text-buffer/goal'
err    = require './error'

class TextBuffer

    goals: []

    constructor: (@core) ->

    #########################
    #   Cursor Management   #
    #########################

    # shift cursor if in certain goal
    protectCursor: (callback) ->
        position = @core.editor.getCursorBufferPosition()
        result = callback()
        @getCurrentGoal position
            .then (goal) =>
                # reposition the cursor in the goal only if:
                #   * it's a fresh hole (coming from "?")
                isFreshHole = goal.isEmpty() and goal.getContent().length is 3
                if isFreshHole
                    newPosition = @core.editor.translate goal.range.start, 3
                    @core.editor.setCursorBufferPosition newPosition
                else
                    @core.editor.setCursorBufferPosition position
                return result
            .catch err.OutOfGoalError, =>
                @core.editor.setCursorBufferPosition position
                return result

    focus: ->
        textEditorElement = atom.views.getView(@core.editor)
        textEditorElement.focus()

    #######################
    #   File Management   #
    #######################

    saveBuffer: -> @core.editor.save()

    #######################
    #   Goal Management   #
    #######################

    removeGoals: ->
        @goals.forEach (goal) -> goal.destroy()
        @goals = []

    removeGoal: (index) ->
        @goals
          .filter (goal) => goal.index is index
          .forEach (goal) => goal.destroy()
        @goals = @goals.filter (goal) => goal.index isnt index

    findGoal: (index) ->
        goals = @goals.filter (goal) => goal.index is index
        return goals[0]

    getCurrentGoal: (cursor = @core.editor.getCursorBufferPosition()) =>
        new Promise (resolve, reject) =>
            goals = @goals.filter (goal) =>
                goal.range.containsPoint cursor
            if goals.length is 1
                resolve goals[0]
            else
                reject new err.OutOfGoalError

    warnOutOfGoal: =>
        @core.panel.setContent 'Out of goal', ['For this command, please place the cursor in a goal'], 'warning'

    warnEmptyGoal: (error) =>
        @core.panel.setContent 'No content', [error.message], 'warning'

    # query for expression if the goal is empty
    checkGoalContent: (messages) => (goal) =>
        content = escape goal.getContent()
        if content
            Promise.resolve goal
        else
            @core.panel.setContent messages.title, [], 'plain-text', messages.placeholder
            @core.panel
                .query()
                .then (expr) =>
                    if expr
                        goal.setContent expr
                        Promise.resolve goal
                    else
                        Promise.reject new err.EmptyGoalError messages.error
                , =>
                    Promise.reject new err.EmptyGoalError messages.error

    ################
    #   Commands   #
    ################

    nextGoal: ->

        cursor = @core.editor.getCursorBufferPosition()
        nextGoal = null

        positions = @goals.map (goal) =>
            start = goal.range.start
            @core.editor.translate start, 3

        positions.forEach (position) =>
            if position.isGreaterThan cursor
                nextGoal ?= position

        # no goal ahead of cursor, loop back
        if nextGoal is null
            nextGoal = positions[0]

        # jump only when there are goals
        if positions.length isnt 0
            @core.editor.setCursorBufferPosition nextGoal

    previousGoal: ->
        cursor = @core.editor.getCursorBufferPosition()
        previousGoal = null

        positions = @goals.map (goal) =>
            start = goal.range.start
            @core.editor.translate start, 3

        positions.forEach (position) =>
            if position.isLessThan cursor
                previousGoal = position

        # no goal ahead of cursor, loop back
        if previousGoal is null
            previousGoal = positions[positions.length - 1]

        # jump only when there are goals
        if positions.length isnt 0
            @core.editor.setCursorBufferPosition previousGoal

    jumpToGoal: (index) ->
        goal = @goals.filter((goal) => goal.index is index)[0]

        if goal
            start = goal.range.start
            position = @core.editor.translate start, 3
            @core.editor.setCursorBufferPosition position
            @focus()

    jumpToLocation: (location) ->
        @focus()
        if location.path
            @getCurrentGoal(location.range.start).then (goal) =>
                    if location.range.start.row is goal.range.start.row
                            location.range = location.range.translate([0, 2])  # hole boundary
                    @core.editor.setSelectedBufferRange location.range, true
                .catch =>
                    @core.editor.setSelectedBufferRange location.range, true
        else
            @getCurrentGoal().then (goal) =>
                    if location.range.start.row is 0
                        range = location.range
                                    .translate(goal.range.start)
                                    .translate([0, 2])  # hole boundary
                    else
                        range = location.range
                                    .translate([goal.range.start.row, 0])

                    @core.editor.setSelectedBufferRange range, true
               .catch @warnOutOfGoal

    ########################
    #   Command Handlers   #
    ########################

    onGoalsAction: (indices) -> @protectCursor =>
        textRaw = @core.editor.getText()
        @removeGoals()
        getHoles(textRaw, indices).forEach (token) =>
            range = @core.editor.fromCIRange token.originalRange
            @core.editor.setTextInBufferRange range, token.content
            goal = new Goal @core.editor, token.goalIndex, token.modifiedRange
            @goals.push goal

    onSolveAllAction: (index, content) -> @protectCursor =>
        goal = @findGoal index
        goal.setContent content
        return goal

    onGiveAction: (index, content, paran) -> @protectCursor =>
        goal = @findGoal index
        if content.length > 0
            content = content.replace(/\\n/g, '\n')
            goal.setContent content
        if paran
            content = goal.getContent()
            goal.setContent "(#{content})"

        goal.removeBoundary()
        @removeGoal index

    onMakeCaseAction: (content) -> @protectCursor =>
         @getCurrentGoal().then (goal) =>
                goal.writeLines content
            .catch @warnOutOfGoal

    onMakeCaseActionExtendLam: (content) -> @protectCursor =>
         @getCurrentGoal().then (goal) =>
                 goal.writeLambda content
            .catch @warnOutOfGoal

    onGoto: (filepath, charIndex) ->
        if @core.getPath() is filepath
            position = @core.editor.fromIndex charIndex - 1
            @core.editor.setCursorBufferPosition position

    # Agda generates files with syntax highlighting notations,
    # those files are temporary and should be deleted once used.
    # note: no highlighting yet, we'll just delete them.
    onHighlightLoadAndDelete: (filepath) -> fs.unlink filepath

module.exports = TextBuffer
