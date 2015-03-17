{EventEmitter} = require 'events'
Q = require 'Q'
PanelView = require './view_'

class PanelModel extends EventEmitter

    # data
    title: ''
    content: []
    type: ''
    placeholder: ''
    queryString: ''
    inputMethod:
        input: ''
        candidateKeys: []
        candidateSymbols: []

    # flag
    queryOn: false
    inputMethodOn: false

    set: (@title = '', @content = [], @type = '', placeholder = '') ->

    setInputMethod: (input = '', candidateKeys = [], candidateSymbols = []) ->
        @inputMethod =
            input: input
            candidateKeys: candidateKeys
            candidateSymbols: candidateSymbols

    query: ->
        @queryOn = true
        Q.Promise (resolve, reject, notify) =>
            Object.observe @, (changes) => changes.forEach (change) =>
                if change.name is 'input'
                    resolve @queryString
                    @queryOn = false

module.exports = PanelModel
