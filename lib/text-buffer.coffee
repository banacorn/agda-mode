{EventEmitter} = require 'events'
{resizeHoles, findHoles, convertToHoles} = require './text-buffer/pure'
Goal = require './text-buffer/goal'
_ = require 'lodash'
{log, warn, error} = require './logger'

class TextBuffer extends EventEmitter

    goals: []

    constructor: (@core) ->

    # compare goals with indices
    changed: (indices) -> _.isEqual _.pluck(@goals, 'index'), indices

    goalsAction: (indices) ->
        unless @changed indices
            log 'Text Buffer', "setting goals #{indices}"
            @removeGoals()

            textRaw     = @core.editor.getText()            # get raw text
            textBracket = convertToHoles textRaw            #   ?  => {!!}
            text        = resizeHoles textBracket, indices  # {!!} => {!  !}
            @core.editor.setText text

            positions   = findHoles text
            positions.forEach (pos, i) =>
                index = indices[i]
                goal  = new Goal @core.editor, index, pos.start, pos.end - 2
                @goals.push goal

    #######################
    #   Goal Management   #
    #######################

    removeGoals: ->
        log 'Text Buffer', 'remove goals'
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

    inSomeGoal: (cursor = @core.editor.getCursorBufferPosition()) ->
        goals = @goals.filter (goal) =>
            goal.getRange().containsPoint cursor
        if goals.length is 1
            return goals[0]
        else
            return null

    ################
    #   Commands   #
    ################

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
            content = goal.getContent()
            empty = content.replace(/\s/g, '').length is 0
            if empty
                warn 'Text Buffer', 'empty content'
                @core.panel.outputInfo 'Please type in the expression to give'
            else
                @core.executable.give goal
        else
            warn 'Text Buffer', 'out of goal'
            @core.panel.outputInfo 'For this command, please place the cursor in a goal'

    goalType: ->
        goal = @inSomeGoal()
        if goal
            content = goal.getContent()
            empty = content.replace(/\s/g, '').length is 0
            if empty
                warn 'Text Buffer', 'empty content'
                @core.panel.outputInfo 'Please type in the expression to infer'
            else
                @core.executable.goalType goal
        else
            warn 'Text Buffer', 'out of goal'
            @core.panel.outputInfo 'For this command, please place the cursor in a goal'


    ########################
    #   Command Handlers   #
    ########################

    giveAction: (index, content) ->
        log 'Text Buffer', 'handling give-action'
        goal = @findGoal index
        if content
            goal.setContent content
        goal.removeBoundary()
        @removeGoal index


module.exports = TextBuffer
