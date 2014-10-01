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

      # kick off the decorator view
      @decorator.resize range

      # triggered then new characters are typed in
      @marker.on 'changed', (ev) =>

        # range & decorator
        range = new Range ev.newTailBufferPosition, ev.newHeadBufferPosition

        # input content
        content = @agda.editor.getBuffer().getTextInRange range
        content = content.substr 1 # strip the leading \

        # see if the input is in the keymap
        {valid, result} = @validate content

        if valid
          # no further possible key combinations
          # replace with symbol right away
          if Object.keys(result).length is 1
            @deactivate()
            symbol = result['>>'][0]
            @agda.editor.getBuffer().setTextInRange range, symbol

          # further key combinations are possible
          else
            @decorator.resize range

        # key combination out of keymap
        # replace with closest the symbol possible
        else
          @deactivate()
          symbol = result['>>']
          if symbol.length > 0
            lastInput = content.substr -1
            refill = symbol[0] + lastInput
            @agda.editor.getBuffer().setTextInRange range, refill

    # input method already activated
    # this will happen only 2 consecutive backslash '\' was punched in
    # and we shall leave 1 backslash in the buffer, then deactivate
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

    @css
        top: topLeft.top
        left: topLeft.left
    @width downRight.left - topLeft.left
    @text ' '.repeat length
    @show()

module.exports = InputMethod
