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
    inputBuffer: ''
    # synchonize with the text buffer
    outputBuffer: ''
    # visual marker
    textBufferMarker: null

    @trie: require './input-method/keymap.js'

    constructor: (@core) ->

        @on 'deactivate', (range) =>
            log 'IM', "deactivate #{range}"
            @deactivate()

        @on 'insert', (range, char) =>
            log 'IM', "insert '#{char}'"
            {output, further, candidateKeys, candidateSymbols} = @translate @inputBuffer
            log 'IM', "@inputBuffer: '#{@inputBuffer}' translates to '#{output}'"
            @updateOutputBuffer output
            if further
                @core.panelModel.setInputMethod @inputBuffer, candidateKeys, candidateSymbols
            else
                @deactivate()

        @on 'delete', (range, textBuffer) =>
            {output, further, candidateKeys, candidateSymbols} = @translate @inputBuffer
            log 'IM', "delete #{range} #{textBuffer} #{@inputBuffer}"
            if further
                @core.panelModel.setInputMethod @inputBuffer, candidateKeys, candidateSymbols


    activate: ->
        if not @activated

            # initializations
            log 'IM', 'activated'
            @inputBuffer = ''
            @outputBuffer = ''
            @activated = true

            # monitors raw text buffer and figures out what happend
            startPosition = @core.editor.getCursorBufferPosition()
            @textBufferMarker = @core.editor.markBufferRange(new Range startPosition, startPosition)
            @textBufferMarker.onDidChange @dispatchEvent

            # decoration
            @decoration = @core.editor.decorateMarker @textBufferMarker,
                type: 'highlight'
                class: 'agda-input-method'

            # insert '\' at the cursor
            @updateOutputBuffer '\\'

            # initial input suggestion
            @core.panelModel.inputMethodOn = true
            @core.panelModel.setInputMethod '', @getCandidateKeys InputMethod.trie, []

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

        range = @textBufferMarker.getBufferRange()
        textBuffer = @core.editor.getBuffer().getTextInRange range

        unless @mute
            if textBuffer.length is 0
                # got wiped out
                @emit 'deactivate', range
            else
                if textBuffer.length > @outputBuffer.length
                    @inputBuffer += textBuffer.substr -1
                    @outputBuffer = textBuffer
                    @emit 'insert', range, textBuffer.substr -1
                if textBuffer.length < @outputBuffer.length
                    @inputBuffer = @inputBuffer.substr(0, @inputBuffer.length - 1)
                    @outputBuffer = textBuffer
                    @emit 'delete', range, textBuffer


    #######################
    ###   Text Buffer   ###
    #######################

    updateOutputBuffer: (text) ->

        # update text buffer
        @muteEvent =>
            @core.editor.getBuffer().delete @textBufferMarker.getBufferRange()
            @core.editor.getBuffer().insert @textBufferMarker.getBufferRange().start, text

        # update output buffer
        @outputBuffer = text

    ##################
    ###   Keymap   ###
    ##################

    getCandidateKeys: (trie) -> Object.keys(_.omit trie, '>>')
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
        candidateKeys    = @getCandidateKeys trie
        candidateSymbols = @getCandidateSymbols trie
        if valid
            if candidateKeys.length is 0
                if candidateSymbols.length is 0
                    output = '\\' + input
                else
                    output = candidateSymbols[0]
                return {
                    output: output
                    further: false
                }
            else
                if candidateSymbols.length is 0
                    output = @outputBuffer
                else
                    output = candidateSymbols[0]
                return {
                    output: output
                    further: true
                    candidateKeys: candidateKeys
                    candidateSymbols: candidateSymbols
                }

        else
            # key combination out of keymap
            # replace with closest the symbol possible
            # log 'IM!', "input buffer: #{@inputBuffer} \n output buffer #{@outputBuffer} \n input #{input}"
            return {
                output: @outputBuffer
                further: false
            }

module.exports = InputMethod
