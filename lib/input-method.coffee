{Range, Point} = require 'atom'
{_} = require 'lodash'
{EventEmitter} = require 'events'
{View, Point, $} = require 'atom'

class InputMethod extends EventEmitter

    activated: false
    input: ''

    @trie: require './input-method/keymap.js'

    constructor: (@core) ->
        @decorator = new InputMethodDecorator @core

    activate: ->
        if not @activated

            @activated = true

            # range & marker
            start = @core.editor.getCursorBufferPosition()
            @marker = @core.editor.markBufferRange(new Range start, start)

            # insert '\' to the buffer
            @core.editor.getBuffer().insert start, '\\'

            # kick off the decorator view
            @decorator.resize @marker.bufferMarker.range

            # initial input suggestion
            candidateKeys = Object.keys(_.omit InputMethod.trie, '>>')
            @core.panel.activateIM '', candidateKeys, []


            # triggered then new characters are typed in
            @marker.on 'changed', (ev) =>

                # range & decorator
                range = new Range ev.newTailBufferPosition, ev.newHeadBufferPosition

                # console.log "@input #{@input}"
                # console.log "#{@core.editor.getBuffer().getTextInRange(range)}"
                # console.log @core.editor.getBuffer().getTextInRange(range) is ''

                # update input content incrementally,
                # append only with the last character,
                # since the former characters may could have been replaced with a preview symbol
                newCharacter = @core.editor.getBuffer().getTextInRange(range).substr(1).substr(-1)

                # false alarm
                # return if newCharacter is ''

                # update @input with the newly inserted character
                @input += newCharacter

                # see if the input is in the keymap
                {valid, result} = @validate()

                candidateKeys = Object.keys(_.omit result, '>>')
                candidateSymbols = result[">>"]

                if valid
                    if Object.keys(result).length is 1
                        # no further possible key combinations
                        # replace with symbol right away
                        @deactivate()
                        symbol = result['>>'][0]
                        @core.editor.getBuffer().setTextInRange range, symbol

                    else
                        # further key combinations are possible
                        if result['>>'].length > 0
                            symbol = result['>>'][0]
                            @core.editor.getBuffer().setTextInRange range, symbol
                            @decorator.resize(new Range range.start, range.start.translate(new Point 0, 1))
                        else
                            @decorator.resize range

                    @core.panel.activateIM @input, candidateKeys, candidateSymbols

                else
                    # key combination out of keymap
                    # replace with closest the symbol possible
                    symbol = result['>>']
                    if symbol.length > 0
                        lastInput = @input.substr -1
                        refill = symbol[0] + lastInput
                        # console.log "symbol #{symbol} @input #{@input} refill #{refill}"
                        @core.editor.getBuffer().setTextInRange range, refill
                    @deactivate()

        else
            # input method already activated
            # this will happen only 2 consecutive backslash '\' was punched in
            # and we shall leave 1 backslash in the buffer, then deactivate
            @deactivate()


    deactivate: ->

        if @activated
            @core.panel.deactivateIM()
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

    initialize: (@core) ->

        @core.editor.editorView.overlayer.append @
        @addClass 'agda-input-method'

    resize: (range) ->

        topLeft   = @core.editor.pixelPositionForBufferPosition range.start
        downRight = @core.editor.pixelPositionForBufferPosition range.end
        length = range.end.column - range.start.column

        @css
            top: topLeft.top
            left: topLeft.left
        @width downRight.left - topLeft.left
        @text ' '.repeat length
        @show()

module.exports = InputMethod
