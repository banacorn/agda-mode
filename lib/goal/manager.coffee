{EventEmitter} = require 'events'
{Point, Range} = require 'atom'
Goal = require './goal'

# manages all Goals in a editor
class GoalManager extends EventEmitter

  goals: []

  constructor: (@agda) ->
    @destroyGoals()
    @agda.once 'quit', @destroyGoals

  indicesOf: (string, pattern) ->
    indices = []
    cursor = 0
    result = string.match pattern
    while result
      indices.push result.index + cursor
      cursor += result.index + result[0].length
      string = string.substr (result.index + result[0].length)
      result = string.match pattern
    return indices

  findGoal: (index) ->
    goals = @goals.filter (goal) => goal.index is index
    return goals[0]

  destroyGoal: (index) ->
    # destroy Goal
    @goals
      .filter (goal) => goal.index is index
      .forEach (goal) => goal.destroy()
    # remove from @goals
    @goals = @goals.filter (goal) => goal.index isnt index


  destroyGoals: =>
    # first, destroy all Goles
    @goals.forEach (goal) =>
      goal.destroy()
    @goals = []
    # second, destroy all wandering markers
    markers = @agda.editor.findMarkers type: 'goal'
    markers.map (marker) => marker.destroy()

  convertGoals: (goalIndices) ->
    @destroyGoals()
    text = @agda.editor.getText()

    pattern = ///
      (\{![^\{\}]*!\})        # goal
      |
      ([\s\(\{\_\;\.\"@]
      \?                  # ?
      [\s\)\}\_\;\.\"@])
    ///

    index = 0

    # make goal {! !}
    text = text
      .split pattern
      .filter (seg) => seg
      .map (seg, i) =>
        if pattern.test seg

          goalIndex = goalIndices[index]
          index += 1
          paddingSpaces = ' '.repeat(goalIndex.toString().length)
          # console.log "[#{goalIndex}] #{seg} | #{/\{!(.*)!\}/.test seg}"
          if /\{!(.*)!\}/.test seg
            seg = /\{!(.*)!\}/.exec(seg)[1].replace(/^\s\s*/, '').replace(/\s\s*$/, '')
            return "{! #{seg + paddingSpaces} !}"
          else
            return seg[0] + "{! #{paddingSpaces} !}" + seg[2]

        else
          seg
      .join('')

    @agda.editor.setText text
    @agda.emit 'goal-manager:buffer-modified'

    return text

  resetGoals: (goalIndices) ->
    @agda.saveCursor()
    text = @convertGoals goalIndices

    # get positions of all goals
    headIndices = @indicesOf text, /\{!/
    tailIndices = @indicesOf text, /!\}/

    # instantiate a Goal if not existed
    for headIndex, i in headIndices
      # headIndex = headIndex
      tailIndex = tailIndices[i]
      goalIndex = goalIndices[i]
      goal = @findGoal goalIndex
      if goal is undefined
        # instantiate Goal
        goal = new Goal(@agda, goalIndex, headIndex, tailIndex)
        @goals.push goal

    @agda.restoreCursor()


  # inSomeGoal :: {Position} -> IO (Maybe Goal)
  inSomeGoal: (cursor) ->
    cursor ?= @agda.editor.getCursorBufferPosition()
    goals = @goals.filter (goal) =>
      goal.getRange().containsPoint cursor
    if goals.length is 1
      return goals[0]
    else if goals.length > 1
      throw "cursor in more than one goal WTF??"
      return null
    else
      return null

  currentGoal: (callback) ->


    goal = @inSomeGoal()

    # in certain goal
    if goal

      # if the content is required,
      # 'content' and 'warningWhenEmpty' will be given
      # and we should check if 'content' is empty
      {command, content, warningWhenEmpty} = callback goal

      # content required
      if warningWhenEmpty

        if empty content
          @agda.view.panel.setStatus 'Warn', 'warning'
          @agda.view.panel.setContent [warningWhenEmpty]
        else
          @agda.executable.process.stdin.write command

      # content not required
      else
        @agda.executable.process.stdin.write command

    # out of goal
    else
      @agda.view.panel.setStatus 'Info'
      @agda.view.panel.setContent ['For this command, please place the cursor in a goal']

  #
  # agda-mode: next-goal
  #
  nextGoalCommand: ->
    cursor = @agda.editor.getCursorBufferPosition()
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
      @agda.editor.setCursorBufferPosition nextGoal

  #
  # agda-mode: previous-goal
  #
  previousGoalCommand: ->
    cursor = @agda.editor.getCursorBufferPosition()
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
      @agda.editor.setCursorBufferPosition previousGoal


  #
  # agda-mode: give
  #
  giveCommand: ->

    @currentGoal (goal) =>
      goalIndex = goal.index
      start = goal.getStart()
      startIndex = goal.toIndex start
      end = goal.getEnd()
      endIndex = goal.toIndex end
      content = escape goal.getContent()

      return {
        command: "IOTCM \"#{@agda.filepath}\" NonInteractive Indirect
          (Cmd_give #{goalIndex} (Range [Interval (Pn (Just (mkAbsolute
          \"#{@agda.filepath}\")) #{startIndex} #{start.row + 1} #{start.column + 1})
          (Pn (Just (mkAbsolute \"#{@agda.filepath}\")) #{endIndex} #{end.row + 1}
          #{end.column + 1})]) \"#{content}\" )\n"
        content: content
        warningWhenEmpty: 'Please type in the expression to give'
      }

  giveHandler: (index, content) ->

    goal = @findGoal index
    if content
      goal.setContent content
    goal.removeBoundary()
    @destroyGoal index
    @agda.emit 'goal-manager:buffer-modified'


  goalTypeCommand: ->
    @currentGoal (goal) =>
      goalIndex = goal.index
      return command: "IOTCM \"#{@agda.filepath}\" NonInteractive Indirect ( Cmd_goal_type Simplified #{goalIndex} noRange \"\" )\n"

  contextCommand: ->
    @currentGoal (goal) =>
      goalIndex = goal.index
      return command: "IOTCM \"#{@agda.filepath}\" NonInteractive Indirect ( Cmd_context Simplified #{goalIndex} noRange \"\" )\n"

  goalTypeAndContextCommand: ->
    @currentGoal (goal) =>
      goalIndex = goal.index
      return command: "IOTCM \"#{@agda.filepath}\" NonInteractive Indirect ( Cmd_goal_type_context Simplified #{goalIndex} noRange \"\" )\n"


  goalTypeAndInferredTypeCommand: ->
    @currentGoal (goal) =>
      goalIndex = goal.index
      content = escape goal.getContent()

      return {
        command: "IOTCM \"#{@agda.filepath}\" NonInteractive Indirect ( Cmd_goal_type_context_infer Simplified #{goalIndex} noRange \"#{content}\" )\n"
        content: content
        warningWhenEmpty: 'Please type in the expression to infer'
      }

  refineCommand: ->
    @currentGoal (goal) =>
      goalIndex = goal.index
      start = goal.getStart()
      startIndex = goal.toIndex start
      end = goal.getEnd()
      endIndex = goal.toIndex end
      content = escape goal.getContent()

      return {
        command: "IOTCM \"#{@agda.filepath}\" NonInteractive Indirect
          ( Cmd_refine_or_intro False #{goalIndex} (Range [Interval (Pn (Just
           (mkAbsolute \"#{@agda.filepath}\")) #{startIndex} #{start.row + 1} #{start.column + 1})
           (Pn (Just (mkAbsolute \"#{@agda.filepath}\")) #{endIndex} #{end.row + 1}
            #{end.column + 1})]) \"#{content}\" )\n"
        content: content
        warningWhenEmpty: 'Please type in the expression to refine'
      }

  caseCommand: ->
    @currentGoal (goal) =>
      goalIndex = goal.index
      start = goal.getStart()
      startIndex = goal.toIndex start
      end = goal.getEnd()
      endIndex = goal.toIndex end
      content = escape goal.getContent()

      return {
        command: "IOTCM \"#{@agda.filepath}\" NonInteractive Indirect
          ( Cmd_make_case #{goalIndex} (Range [Interval (Pn (Just
          (mkAbsolute \"#{@agda.filepath}\")) #{startIndex} #{start.row + 1} #{start.column + 1})
          (Pn (Just (mkAbsolute \"#{@agda.filepath}\")) #{endIndex} #{end.row + 1}
           #{end.column + 1})]) \"#{content}\" )\n"
        content: content
        warningWhenEmpty: 'Please type in the expression to make case'
      }

  caseHandler: (content) ->
    cursor = @agda.editor.getCursorBufferPosition()
    goals = @goals.filter (goal) =>
      goal.getRange().containsPoint cursor
    # in certain goal
    if goals.length is 1
      goal = goals[0]
      goal.writeLines content
      @agda.load()
    else
      throw "not in any goal when splitting case!!"

  autoCommand: ->
    @currentGoal (goal) =>
      goalIndex = goal.index
      start = goal.getStart()
      startIndex = goal.toIndex start
      end = goal.getEnd()
      endIndex = goal.toIndex end
      content = escape goal.getContent()

      return {
        command: "IOTCM \"#{@agda.filepath}\" NonInteractive Indirect
          ( Cmd_auto #{goalIndex} (Range [Interval (Pn (Just
          (mkAbsolute \"#{@agda.filepath}\")) #{startIndex} #{start.row + 1} #{start.column + 1})
          (Pn (Just (mkAbsolute \"#{@agda.filepath}\")) #{endIndex} #{end.row + 1}
           #{end.column + 1})]) \"#{content}\" )\n"
      }


empty = (content) -> content.replace(/\s/g, '').length is 0
# escapes '\n'
escape = (content) -> content.replace(/\n/g, '\\n')
module.exports = GoalManager
