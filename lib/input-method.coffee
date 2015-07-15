{Range} = require 'atom'
{log} = require './logger'
Keymap = require './input-method/keymap'

# Input Method Singleton (initialized only once per editor, activaed or not)
class InputMethod

    activated: false
    mute: false

    # raw characters
    rawInput: ''
    # visual marker
    textBufferMarker: null

    constructor: (@core) ->

        # monitors @core.panelModel.inputMethod.clicked
        Object.observe @core.panelModel.inputMethod, (changes) =>
            changes.forEach (change) =>
                if change.name is "clicked"
                    @insertChar change.object.clicked


    activate: ->
        if not @activated

            # initializations
            log 'IM', 'activated'
            @rawInput = ''
            @activated = true

            # monitors raw text buffer and figures out what happend
            startPosition = @core.editor.getCursorBufferPosition()
            @textBufferMarker = @core.editor.markBufferRange(new Range startPosition, startPosition)
            @textBufferMarker.onDidChange @dispatchEvent

            # decoration
            @decoration = @core.editor.decorateMarker @textBufferMarker,
                type: 'highlight'
                class: 'agda-input-method'

            # insert '\' at the cursor quitely without triggering any shit
            @muteEvent =>
                @insertChar '\\'

            # initial input suggestion
            @core.panelModel.inputMethodOn = true
            @core.panelModel.setInputMethod '', Keymap.getSuggestionKeys Keymap.trie, []

            # @core.panel.inputMethodMode = true
            # @core.panel.inputMethod =
            #     rawInput: ''
            #     suggestionKeys: Keymap.getSuggestionKeys Keymap.trie
            #     candidateSymbols: []

        else
            # input method already activated
            # this will happen when the 2nd backslash '\' got punched in
            # we shall leave 1 backslash in the buffer, then deactivate
            @deactivate()

    deactivate: ->

        if @activated
            log 'IM', 'deactivated'
            @core.panelModel.inputMethodOn = false
            # @core.panel.inputMethodMode = false
            @textBufferMarker.destroy()
            @decoration.destroy()
            @activated = false

    ##################
    ###   Events   ###
    ##################

    muteEvent: (callback) ->
        @mute = true
        callback()
        @mute = false

    dispatchEvent: (ev) =>

        unless @mute

            rangeOld = new Range ev.oldTailBufferPosition, ev.oldHeadBufferPosition
            rangeNew = new Range ev.newTailBufferPosition, ev.newHeadBufferPosition
            textBuffer = @core.editor.getBuffer().getTextInRange rangeNew
            char = textBuffer.substr -1

            # const for result of Range::compare()
            INSERT = -1
            DELETE = 1
            change = rangeNew.compare rangeOld


            if rangeNew.isEmpty()
                @deactivate()
            else if change is INSERT
                char = textBuffer.substr -1
                @rawInput += char
                log 'IM', "insert '#{char}' #{@rawInput}"
                {translation, further, suggestionKeys, candidateSymbols} = Keymap.translate @rawInput
                log 'IM', "raw input '#{@rawInput}' translates to '#{translation}'"

                # reflects current translation to the text buffer
                if translation
                    @muteEvent => @replaceString translation

                # update view
                if further
                    @core.panelModel.setInputMethod @rawInput, suggestionKeys, candidateSymbols
                else
                    @deactivate()

            else if change is DELETE
                @rawInput = @rawInput.substr(0, @rawInput.length - 1)
                log 'IM', "delete #{@rawInput}"
                {translation, further, suggestionKeys, candidateSymbols} = Keymap.translate @rawInput
                @core.panelModel.setInputMethod @rawInput, suggestionKeys, candidateSymbols


    #######################
    ###   Text Buffer   ###
    #######################

    # inserts 1 character to the text buffer (may trigger some events)
    insertChar: (char) ->
        @core.editor.getBuffer().insert @textBufferMarker.getBufferRange().end, char

    # replace content of the marker with supplied string (may trigger some events)
    replaceString: (str) ->
        @core.editor.getBuffer().setTextInRange @textBufferMarker.getBufferRange(), str

module.exports = InputMethod
