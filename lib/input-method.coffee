{Range, Point} = require 'atom'
{_} = require 'lodash'
{EventEmitter} = require 'events'
{Point} = require 'atom'
{$, View} = require 'atom-space-pen-views'
{log, warn, error} = require './logger'

# Input Method Singleton (initialized only once per editor, activaed or not)
class InputMethod extends EventEmitter

    activated: false
    mute: false

    # raw characters
    rawInput: ''
    # visual marker
    textBufferMarker: null

    @trie: require './input-method/keymap.js'

    constructor: (@core) ->

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
            @core.panelModel.setInputMethod '', @getSuggestionKeys InputMethod.trie, []

        else
            # input method already activated
            # this will happen when the 2nd backslash '\' got punched in
            # we shall leave 1 backslash in the buffer, then deactivate
            @deactivate()

    deactivate: ->

        if @activated
            log 'IM', 'deactivated'
            @core.panelModel.inputMethodOn = false
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
                {translation, further, suggestionKeys, candidateSymbols} = @translate @rawInput
                log 'IM', "raw input '#{@rawInput}' translates to '#{translation}'"

                # reflects current translation to the text buffer
                if translation
                    @muteEvent => @replaceString translation

                # update view
                if further
                    @core.panelModel.setInputMethod @inputBuffer, suggestionKeys, candidateSymbols
                else
                    @deactivate()

            else if change is DELETE
                @rawInput = @rawInput.substr(0, @rawInput.length - 1)
                log 'IM', "delete #{@rawInput}"


    #######################
    ###   Text Buffer   ###
    #######################

    # inserts 1 character to the text buffer (may trigger some events)
    insertChar: (char) ->
        @core.editor.getBuffer().insert @textBufferMarker.getBufferRange().end, char

    # replace content of the marker with supplied string (may trigger some events)
    replaceString: (str) ->
        @core.editor.getBuffer().setTextInRange @textBufferMarker.getBufferRange(), str

    ##################
    ###   Keymap   ###
    ##################

    getSuggestionKeys: (trie) -> Object.keys(_.omit trie, '>>')
    getCandidateSymbols: (trie) -> trie['>>']

    # see if input is in the keymap
    validate: (input) ->
        valid = true
        trie = InputMethod.trie
        for i in [0 .. input.length - 1]
            char = input.charAt i
            next = trie[char]
            if next
                trie = next
            else
                valid = false
                break

        return {
            valid: valid
            trie: trie
        }

    # converts characters to symbol, and tells if there's any further possible combinations
    translate: (input) ->
        {valid, trie} = @validate input
        suggestionKeys   = @getSuggestionKeys trie
        candidateSymbols = @getCandidateSymbols trie
        if valid
            if suggestionKeys.length is 0
                return {
                    translation: candidateSymbols[0]
                    further: false
                    suggestionKeys: []
                    candidateSymbols: []
                }
            else
                return {
                    translation: candidateSymbols[0]
                    further: true
                    suggestionKeys: suggestionKeys
                    candidateSymbols: candidateSymbols
                }

        else
            # key combination out of keymap
            # replace with closest the symbol possible
            return {
                translation: undefined
                further: false
                suggestionKeys: []
                candidateSymbols: []
            }

module.exports = InputMethod
