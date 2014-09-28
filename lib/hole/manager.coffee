{EventEmitter} = require 'events'
{Point, Range} = require 'atom'
Hole = require './hole'

# manages all "holes" in a editor
class HoleManager extends EventEmitter

  holes: []

  constructor: (@agda) ->
    @destroyHoles()
    @agda.once 'quit', @destroyHoles

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

  findHole: (index) ->
    holes = @holes.filter (hole) => hole.index is index
    return holes[0]

  destroyHole: (index) ->
    # destroy Hole
    @holes
      .filter (hole) => hole.index is index
      .forEach (hole) => hole.destroy()
    # remove from @holes
    @holes = @holes.filter (hole) => hole.index isnt index


  destroyHoles: =>
    # first, destroy all Holes
    @holes.forEach (hole) =>
      hole.destroy()
    @holes = []
    # second, destroy all wandering markers
    markers = @agda.editor.findMarkers type: 'hole'
    markers.map (marker) => marker.destroy()

  convertHoles: (goalIndices) ->
    @destroyHoles()
    text = @agda.editor.getText()

    pattern = ///
      (\{![^\{\}]*!\})        # hole
      |
      ([\s\(\{\_\;\.\"@]
      \?                  # ?
      [\s\)\}\_\;\.\"@])
    ///

    index = 0

    # make hole {! !}
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
    @agda.emit 'hole-manager:buffer-modified'

    return text

  resetGoals: (goalIndices) ->
    @agda.saveCursor()
    text = @convertHoles goalIndices

    # get positions of all holes
    headIndices = @indicesOf text, /\{!/
    tailIndices = @indicesOf text, /!\}/

    # instantiate a Hole if not existed
    for headIndex, i in headIndices
      # headIndex = headIndex
      tailIndex = tailIndices[i]
      goalIndex = goalIndices[i]
      hole = @findHole goalIndex
      if hole is undefined
        # instantiate Hole
        hole = new Hole(@agda, goalIndex, headIndex, tailIndex)
        @holes.push hole

    @agda.restoreCursor()


  # inSomeHole :: IO (Maybe Hole)
  inSomeHole: ->
    cursor = @agda.editor.getCursorBufferPosition()
    holes = @holes.filter (hole) =>
      hole.getRange().containsPoint cursor
    if holes.length is 1
      return holes[0]
    else if holes.length > 1
      throw "cursor in more than one hole WTF??"
      return null
    else
      return null

  currentHole: (callback) ->
    cursor = @agda.editor.getCursorBufferPosition()
    goals = @holes.filter (hole) =>
      hole.getRange().containsPoint cursor

    # in certain hole
    if goals.length is 1

      # if the content is required,
      # 'content' and 'warningWhenEmpty' will be given
      # and we should check if 'content' is empty
      {command, content, warningWhenEmpty} = callback goals[0]

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

    # out of hole
    else
      @agda.view.panel.setStatus 'Info'
      @agda.view.panel.setContent ['For this command, please place the cursor in a goal']

  #
  # agda-mode: next-goal
  #
  nextGoalCommand: ->
    cursor = @agda.editor.getCursorBufferPosition()
    nextGoal = null

    positions = @holes.map (hole) =>
      start = hole.getStart()
      hole.translate start, 3

    positions.forEach (position) =>
      if position.isGreaterThan cursor
        nextGoal ?= position

    # no hole ahead of cursor, loop back
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

    positions = @holes.map (hole) =>
      start = hole.getStart()
      hole.translate start, 3

    positions.forEach (position) =>
      if position.isLessThan cursor
        previousGoal = position

    # no hole ahead of cursor, loop back
    if previousGoal is null
      previousGoal = positions[positions.length - 1]

    # jump only when there are goals
    if positions.length isnt 0
      @agda.editor.setCursorBufferPosition previousGoal


  #
  # agda-mode: give
  #
  giveCommand: ->

    @currentHole (goal) =>
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

    hole = @findHole index
    if content
      hole.setContent content
    hole.removeBoundary()
    @destroyHole index
    @agda.emit 'hole-manager:buffer-modified'


  goalTypeCommand: ->
    @currentHole (goal) =>
      goalIndex = goal.index
      return command: "IOTCM \"#{@agda.filepath}\" NonInteractive Indirect ( Cmd_goal_type Simplified #{goalIndex} noRange \"\" )\n"

  contextCommand: ->
    @currentHole (goal) =>
      goalIndex = goal.index
      return command: "IOTCM \"#{@agda.filepath}\" NonInteractive Indirect ( Cmd_context Simplified #{goalIndex} noRange \"\" )\n"

  goalTypeAndContextCommand: ->
    @currentHole (goal) =>
      goalIndex = goal.index
      return command: "IOTCM \"#{@agda.filepath}\" NonInteractive Indirect ( Cmd_goal_type_context Simplified #{goalIndex} noRange \"\" )\n"


  goalTypeAndInferredTypeCommand: ->
    @currentHole (goal) =>
      goalIndex = goal.index
      content = escape goal.getContent()

      return {
        command: "IOTCM \"#{@agda.filepath}\" NonInteractive Indirect ( Cmd_goal_type_context_infer Simplified #{goalIndex} noRange \"#{content}\" )\n"
        content: content
        warningWhenEmpty: 'Please type in the expression to infer'
      }

  refineCommand: ->
    @currentHole (goal) =>
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
    @currentHole (goal) =>
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
    goals = @holes.filter (hole) =>
      hole.getRange().containsPoint cursor
    # in certain hole
    if goals.length is 1
      goal = goals[0]
      goal.writeLines content
      @agda.load()
    else
      throw "not in any hole when splitting case!!"

  autoCommand: ->
    @currentHole (goal) =>
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
module.exports = HoleManager
