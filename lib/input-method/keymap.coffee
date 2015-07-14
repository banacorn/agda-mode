# {Range, Point} = require 'atom'
{_} = require 'lodash'
# {EventEmitter} = require 'events'
# {Point} = require 'atom'
# {$, View} = require 'atom-space-pen-views'
# {log, warn, error} = require './logger'

class Keymap

    @trie: require './keymap/mapping.js'
    @getSuggestionKeys: (trie) -> Object.keys(_.omit trie, '>>')
    @getCandidateSymbols: (trie) -> trie['>>']

    # see if input is in the keymap
    @validate: (input) ->
        valid = true
        trie = @trie
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
    @translate: (input) ->
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

module.exports = Keymap
