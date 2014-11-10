{EventEmitter} = require 'events'
{resizeHoles, findHoles, convertToHoles} = require './text-buffer/pure'
Goal = require './text-buffer/goal'
{log, warn, error} = require './logger'

class TextBuffer extends EventEmitter

    goals: []

    constructor: (@core) ->

    setGoals: (indices) ->

        textRaw     = @core.editor.getText()            # get raw text
        textBracket = convertToHoles textRaw            #   ?  => {!!}
        text        = resizeHoles textBracket, indices  # {!!} => {!  !}
        @core.editor.setText text

        positions   = findHoles text
        positions.forEach (pos, i) =>
            index = indices[i]
            goal  = new Goal @core.editor, index, pos.start, pos.end - 2
            @goals.push goal

    removeGoals: ->
        @goals.forEach (goal) -> goal.destroy()

    inSomeGoal: (cursor = @core.editor.getCursorBufferPosition()) ->
        goals = @goals.filter (goal) =>
            goal.getRange().containsPoint cursor
        if goals.length is 1
            return goals[0]
        else
            return null

    nextGoal: ->

        cursor = @core.editor.getCursorBufferPosition()
        nextGoal = null

        positions = @goals.map (goal) =>
            start = goal.getStart()
            goal.translate start, 3

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
            start = goal.getStart()
            goal.translate start, 3

        positions.forEach (position) =>
            if position.isLessThan cursor
                previousGoal = position

        # no goal ahead of cursor, loop back
        if previousGoal is null
            previousGoal = positions[positions.length - 1]

        # jump only when there are goals
        if positions.length isnt 0
            @core.editor.setCursorBufferPosition previousGoal

    give: ->
        goal = @inSomeGoal()
        if goal
            console.log '?'
        else
            warn 'Text Buffer', 'out of goal'
            @core.panel.cursorOutOfGoal()

module.exports = TextBuffer
