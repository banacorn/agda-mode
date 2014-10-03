{Range, Point} = require 'atom'

{EventEmitter} = require 'events'
{View, Point, $} = require 'atom'

class InputMethod extends EventEmitter

  activated: false
  input: ''

  @trie: require './keymap.js'

  constructor: (@agda) ->
    @decorator = new InputMethodDecorator @agda

  activate: ->

    if not @activated

      @activated = true

      # range & marker
      start = @agda.editor.getCursorBufferPosition()
      @marker = @agda.editor.markBufferRange(new Range start, start)

      # insert '\' to the buffer
      @agda.editor.getBuffer().insert start, '\\'

      # kick off the decorator view
      @decorator.resize @marker.bufferMarker.range

      # triggered then new characters are typed in
      @marker.on 'changed', (ev) =>
        # range & decorator
        range = new Range ev.newTailBufferPosition, ev.newHeadBufferPosition

        # console.log "old range: #{@marker.bufferMarker.range.start} #{@marker.bufferMarker.range.end}"
        # console.log "new range: #{range.start} #{range.end}"

        # update input content incrementally,
        # append only with the last character,
        # since the former characters may could have been replaced with a preview symbol
        newCharacter = @agda.editor.getBuffer().getTextInRange(range).substr(1).substr(-1)

        # false alarm
        return if newCharacter is ''

        # update @input with the newly inserted character
        @input += newCharacter

        # see if the input is in the keymap
        {valid, result} = @validate()


        if valid
          if Object.keys(result).length is 1
            # no further possible key combinations
            # replace with symbol right away
            @deactivate()
            symbol = result['>>'][0]
            @agda.editor.getBuffer().setTextInRange range, symbol

          else
            # further key combinations are possible
            if result['>>'].length > 0
              symbol = result['>>'][0]
              @agda.editor.getBuffer().setTextInRange range, symbol
              @decorator.resize(new Range range.start, range.start.translate(new Point 0, 1))
            else
              @decorator.resize range

        else
          # key combination out of keymap
          # replace with closest the symbol possible
          symbol = result['>>']
          if symbol.length > 0
            lastInput = @input.substr -1
            refill = symbol[0] + lastInput
            # console.log "symbol #{symbol} @input #{@input} refill #{refill}"
            @agda.editor.getBuffer().setTextInRange range, refill
          @deactivate()

    else
      # input method already activated
      # this will happen only 2 consecutive backslash '\' was punched in
      # and we shall leave 1 backslash in the buffer, then deactivate
      @deactivate()


  deactivate: ->

    if @activated
      @decorator.hide()
      @marker.destroy()
      @activated = false
      @input = ''

  # if the input is in the keymap
  validate: ->
    valid = true
    cursor = InputMethod.trie
    for i in [0 .. @input.length - 1]
      char = @input.charAt i
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
