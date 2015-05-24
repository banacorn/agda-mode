{EventEmitter} = require 'events'
{resizeHoles, findHoles , digHoles} = require './text-buffer/hole'
Goal = require './text-buffer/goal'
fs = require 'fs'
_ = require 'lodash'
{Point, Range} = require 'atom'
Q = require 'q'
Q.longStackSupport = true
{log, warn, error} = require './logger'

class TextBuffer extends EventEmitter

    goals: []

    constructor: (@core) ->

    # compare goals with indices
    indicesChanged: (indices) -> ! _.isEqual _.pluck(@goals, 'index'), indices
    # compare content with text buffer
    textBufferChanged: (content) -> content isnt @core.editor.getText()

    #########################
    #   Cursor Management   #
    #########################

    protectCursor: (callback) ->
        position = @core.editor.getCursorBufferPosition()
        result = callback()
        @getCurrentGoal position
            .then (goal) =>
                newPosition = goal.translate goal.range.start, 3
                @core.editor.setCursorBufferPosition newPosition
            .fail =>
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
                goal.range.containsPoint cursor
            if goals.length is 1
                resolve goals[0]
            else
                reject()

    warnOutOfGoal: =>
        warn 'Text Buffer', 'out of goal'
        @core.panelModel.set 'Out of goal', ['For this command, please place the cursor in a goal'], 'warning'

    warnCurrentGoalIfEmpty: (goal, warning) =>
        content = goal.content
        isEmpty = content.replace(/\s/g, '').length is 0
        if isEmpty
            warn 'Text Buffer', 'empty content'
            @core.panelModel.set 'No content', [warning], 'warning'


    ################
    #   Commands   #
    ################

    nextGoal: ->

        cursor = @core.editor.getCursorBufferPosition()
        nextGoal = null

        positions = @goals.map (goal) =>
            start = goal.range.start
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
            start = goal.range.start
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

    give: -> @getCurrentGoal().done (goal) =>
            @warnCurrentGoalIfEmpty goal, 'Please type in the expression to give'
            @core.executable.give goal
        , @warnOutOfGoal

    goalType: -> @getCurrentGoal().done (goal) =>
            @core.executable.goalType goal
        , @warnOutOfGoal

    context: -> @getCurrentGoal().done (goal) =>
            @core.executable.context goal
        , @warnOutOfGoal

    goalTypeAndContext: -> @getCurrentGoal().done (goal) =>
            @core.executable.goalTypeAndContext goal
        , @warnOutOfGoal

    goalTypeAndInferredType: -> @getCurrentGoal().done (goal) =>
            @warnCurrentGoalIfEmpty goal, 'Please type in the expression to infer'
            @core.executable.goalTypeAndInferredType goal
        , @warnOutOfGoal

    refine: -> @getCurrentGoal().done (goal) =>
            @core.executable.refine goal
        , @warnOutOfGoal

    case: -> @getCurrentGoal().done (goal) =>
            @warnCurrentGoalIfEmpty goal, 'Please type in the expression to make case'
            @core.executable.case goal
        , @warnOutOfGoal

    auto: -> @getCurrentGoal().done (goal) =>
            @core.executable.auto goal
        , @warnOutOfGoal


    ########################
    #   Command Handlers   #
    ########################

    goalsAction: (indices) -> @protectCursor =>

        textRaw         = @core.editor.getText()            # get raw text
        holes           = findHoles textRaw                 # ? or {!!}
        holesPure       = digHoles holes                    # ? => {!!}
        holesResized    = resizeHoles holesPure, indices    # {!!} => {!  !}


        diff = 0
        holesRepositioned = holesResized.map (obj) =>
            start = @core.editor.buffer.positionForCharacterIndex obj.start + diff
            end   = @core.editor.buffer.positionForCharacterIndex obj.end + diff
            range = new Range start, end

            # update hole's range
            obj.start += diff
            diff += obj.modifiedContent.length - obj.content.length
            obj.end += diff

            # if changed then modify text buffer
            if obj.content isnt obj.modifiedContent
                # console.log "#{range} diff: #{diff} '#{obj.content}' '#{obj.modifiedContent}'"
                @core.editor.setTextInBufferRange range , obj.modifiedContent
            return obj

        log 'Text Buffer', "setting goals #{indices}"

        # refresh goals
        @removeGoals()
        holesRepositioned.forEach (obj, i) =>
            index = indices[i]
            goal = new Goal @core.editor, index, obj.start, obj.end
            @goals.push goal

    giveAction: (index, content, paran) -> @protectCursor =>

        goal = @findGoal index
        if content.length > 0
            content = content.replace(/\\n/g, ' ').replace(/\s{2,}/g, ' ')
            log 'Text Buffer', "handling give-action #{paran} #{content}"
            goal.setContent content
        if paran
            content = goal.getContent()
            goal.setContent "(#{content})"

        goal.removeBoundary()
        @removeGoal index

    makeCaseAction: (content) ->  @protectCursor =>
         @getCurrentGoal().then (goal) =>
                goal.writeLines content
            , @warnOutOfGoal

    goto: (filepath, charIndex) ->
        if @core.filepath is filepath
            position = @core.editor.buffer.positionForCharacterIndex charIndex - 1
            @core.editor.setCursorBufferPosition position
            # scroll down a bit further, or it would be shadowed by the panel
            @core.editor.scrollToBufferPosition position.translate(new Point(10, 0))

    # Agda generates files with syntax highlighting notations,
    # those files are temporary and should be deleted once used.
    # note: no highlighting yet, we'll just delete them.
    highlightLoadAndDelete: (filepath) -> fs.unlink filepath

module.exports = TextBuffer
