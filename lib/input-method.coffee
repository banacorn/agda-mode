{Range, Point} = require 'atom'

{EventEmitter} = require 'events'
{View, Point, $} = require 'atom'

class InputMethod extends EventEmitter

  activated: false

  @trie: require './keymap.js'

  constructor: (@agda) ->
    @decorator = new InputMethodDecorator @agda

  activate: ->

    cursorPos = @agda.editor.getCursorBufferPosition()
    # insert '\' to the buffer
    @agda.editor.getBuffer().insert cursorPos, '\\'

    if not @activated

      @activated = true

      # range & marker
      start = cursorPos
      end = start.translate new Point 0, 1
      range = new Range start, end
      @marker = @agda.editor.markBufferRange range

      # kick off
      @decorator.resize range

      @marker.on 'changed', (ev) =>
        # console.log '-'
        # range & decorator
        range = new Range ev.newTailBufferPosition, ev.newHeadBufferPosition

        # input content
        content = @agda.editor.getBuffer().getTextInRange range
        content = content.substr 1 # strip leading \

        {valid, result} = @validate content

        if valid
          console.log result
          @decorator.resize range

        else
          @deactivate()
          symbol = result['>>']
          if symbol.length > 0
            lastInput = content.substr -1
            refill = symbol[0] + lastInput
            @agda.editor.getBuffer().setTextInRange range, refill



  deactivate: ->

    if @activated
      @decorator.hide()
      @marker.destroy()
      @activated = false

  # if the string is in the keymap
  validate: (string) ->
    valid = true
    cursor = InputMethod.trie
    for i in [0 .. string.length - 1]
      char = string.charAt i
      next = cursor[char]
      if next
        cursor = next
      else
        valid = false
        break

    return {
      valid: valid
      result: cursor
    }


class InputMethodDecorator extends View

  @content: -> @div outlet: 'decorator'

  initialize: (@agda) ->

    @agda.editorView.overlayer.append @
    @addClass 'agda-input-method'

  resize: (range) ->

    topLeft   = @agda.editor.pixelPositionForBufferPosition range.start
    downRight = @agda.editor.pixelPositionForBufferPosition range.end
    length = range.end.column - range.start.column

    console.log "#{downRight.left - topLeft.left} (#{downRight.top}, #{downRight.left}) (#{topLeft.top}, #{topLeft.left}}"
    @css
        top: topLeft.top
        left: topLeft.left
    @width downRight.left - topLeft.left
    @text ' '.repeat length
    @show()

module.exports = InputMethod
