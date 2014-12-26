{EventEmitter} = require 'events'
{resizeHoles, findHoles, convertToHoles} = require './text-buffer/pure'
Goal = require './text-buffer/goal'
_ = require 'lodash'
Q = require 'Q'
{log, warn, error} = require './logger'

class TextBuffer extends EventEmitter

    goals: []

    constructor: (@core) ->

    # compare goals with indices
    changed: (indices) -> _.isEqual _.pluck(@goals, 'index'), indices


    #########################
    #   Cursor Management   #
    #########################

    protectCursor: (callback) ->
        position = @core.editor.getCursorBufferPosition()
        result = callback()
        @getCurrentGoal position
            .then (goal) =>
                newPosition = goal.translate goal.getStart(), 3
                @core.editor.setCursorBufferPosition newPosition
            .fail =>
                @core.editor.setCursorBufferPosition position
        return result


    #######################
    #   File Management   #
    #######################

    saveBuffer: -> @core.editor.save()

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

    getCurrentGoal: (cursor = @core.editor.getCursorBufferPosition()) =>
        Q.Promise (resolve, reject, notify) =>
            goals = @goals.filter (goal) =>
                goal.getRange().containsPoint cursor
            if goals.length is 1
                resolve goals[0]
            else
                reject()

    getCurrentGoalOrWarn: (cursor = @core.editor.getCursorBufferPosition()) ->
        @getCurrentGoal cursor
            .fail =>
                warn 'Text Buffer', 'out of goal'
                @core.panel.outputInfo 'For this command, please place the cursor in a goal'

    warnCurrentGoalIfEmpty: (goal, warning) =>
        content = goal.getContent()
        isEmpty = content.replace(/\s/g, '').length is 0
        if isEmpty
            warn 'Text Buffer', 'empty content'
            @core.panel.outputInfo warning


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

    give: -> @getCurrentGoalOrWarn().then (goal) =>
        @warnCurrentGoalIfEmpty goal, 'Please type in the expression to give'
        @core.executable.give goal

    goalType: -> @getCurrentGoalOrWarn().then (goal) =>
        @core.executable.goalType goal

    context: -> @getCurrentGoalOrWarn().then (goal) =>
        @core.executable.context goal

    goalTypeAndContext: -> @getCurrentGoalOrWarn().then (goal) =>
        @core.executable.goalTypeAndContext goal

    goalTypeAndInferredType: -> @getCurrentGoalOrWarn().then (goal) =>
        @warnCurrentGoalIfEmpty goal, 'Please type in the expression to infer'
        @core.executable.goalTypeAndInferredType goal

    refine: -> @getCurrentGoalOrWarn().then (goal) =>
        @warnCurrentGoalIfEmpty goal, 'Please type in the expression to refine'
        @core.executable.refine goal

    case: -> @getCurrentGoalOrWarn().then (goal) =>
        @warnCurrentGoalIfEmpty goal, 'Please type in the expression to make case'
        @core.executable.case goal

    auto: -> @getCurrentGoalOrWarn().then (goal) =>
        @core.executable.auto goal


    ########################
    #   Command Handlers   #
    ########################

    goalsAction: (indices) -> @protectCursor =>
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
                
    giveAction: (index, content) -> @protectCursor =>
        log 'Text Buffer', "handling give-action #{content}"
        goal = @findGoal index
        if content
            goal.setContent content
        goal.removeBoundary()
        @removeGoal index

    makeCaseAction: (content) ->  @protectCursor =>
        @getCurrentGoalOrWarn().then (goal) =>
            goal.writeLines content

module.exports = TextBuffer
