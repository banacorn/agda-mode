{Range, Point} = require 'atom'

{EventEmitter} = require 'events'
{View, Point, $} = require 'atom'

class InputMethod extends EventEmitter

  activated: false

  @trie: require './keymap.js'

  constructor: (@agda) ->
    @decorator = new InputMethodDecorator @agda

  activate: ->

    if not @activated

      @activated = true

      # range & marker
      start = @agda.editor.getCursorBufferPosition()
      end = start.translate new Point 0, 1
      range = new Range start, end
      @marker = @agda.editor.markBufferRange range

      # insert '\' to the buffer
      @agda.editor.getBuffer().insert start, '\\'

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
          # no further possible key combination
          # replace with symbol right away
          if Object.keys(result).length is 1
            @deactivate()
            symbol = result['>>'][0]
            @agda.editor.getBuffer().setTextInRange range, symbol
          else
            @decorator.resize range
            console.log result

        else
          @deactivate()
          symbol = result['>>']
          if symbol.length > 0
            lastInput = content.substr -1
            refill = symbol[0] + lastInput
            @agda.editor.getBuffer().setTextInRange range, refill
    else

      @deactivate()


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
