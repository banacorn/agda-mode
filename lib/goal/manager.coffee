{EventEmitter} = require 'events'
{Point, Range} = require 'atom'
Goal = require './goal'

commentRegex = ///
  (--[^\r\n]*[\r\n])
///

goalBracketRegex = ///
  (\{![^!\}]*!\})
///

goalQMRegex = ///
  ([\s\(\{\_\;\.\"@]
  \?                  # ?
  [\s\)\}\_\;\.\"@])
///

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

  findGoals: (text) ->

    tokens = new Lexer text
      .lex commentRegex, 'comment'
      .lex goalBracketRegex, 'goal bracket'
      .result

    # for counting character position
    pos = 0

    positions = tokens
      .map (obj) =>
        obj.start = pos
        pos += obj.content.length
        obj.end = pos
        return obj
      .filter (obj) => obj.type is 'goal bracket'
      .map (obj) => return {
        start: obj.start
        end: obj.end
      }

    return positions


  convertGoals: (goalIndices) ->
    @destroyGoals()
    text = @agda.editor.getText()

    tokens = new Lexer text
      .lex commentRegex, 'comment'
      .lex goalBracketRegex, 'goal bracket'
      .lex goalQMRegex, 'goal QM'
      .result

    # for counting goals
    index = 0


    text = tokens.map (obj) =>
        # adjusts the space between goal brackets
        if obj.type is 'goal bracket'
          goalIndex = goalIndices[index]
          index += 1
          paddingSpaces = ' '.repeat(goalIndex.toString().length)
          # strip whitespaces
          data = /\{!(.*)!\}/.exec(obj.content)[1].replace(/^\s\s*/, '').replace(/\s\s*$/, '')
          obj.content = "{! #{data + paddingSpaces} !}"
          return obj
        else if obj.type is 'goal QM'
          goalIndex = goalIndices[index]
          index += 1
          paddingSpaces = ' '.repeat(goalIndex.toString().length)
          obj.content = "#{obj.content[0]}{! #{paddingSpaces} !}#{obj.content[2]}"
          return obj
        else
          return obj
      .map (obj) => obj.content
      .join('')

    @agda.editor.setText text
    @agda.emit 'goal-manager:buffer-modified'

    return text

  resetGoals: (goalIndices) ->

    @agda.saveCursor()
    text = @convertGoals goalIndices

    positions = @findGoals text
    positions.forEach (pos, i) =>
      goalIndex = goalIndices[i]
      goal = @findGoal goalIndex
      if goal is undefined
        # instantiate Goal
        goal = new Goal(@agda, goalIndex, pos.start, pos.end - 2)
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

isOf = (token, pattern) => pattern.test token

class Lexer
  result: []
  constructor: (raw) ->
    @result = [{
        content: raw
        type: 'raw'
      }]
  lex: (regex, typeName) ->
    pulp = @result.map (token) =>
      if token.type is 'raw'
        token.content
          .split regex
          .map (token, i) =>
            if isOf token, regex
              type = typeName
            else
              type = 'raw'
            return {
              content: token
              type: type
            }
          .filter (token) => token.content
      else
        token
    @result = [].concat.apply([], pulp)
    return @
module.exports = GoalManager
