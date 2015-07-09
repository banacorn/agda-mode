Promise = require 'bluebird'
{QueryCancelledError} = require '../error'
class PanelModel

    # data
    title: ''
    content: []
    type: ''
    placeholder: ''
    queryString: ''
    inputMethod:
        input: ''
        suggestionKeys: []
        candidateSymbols: []

    # flag
    inputMethodOn: false

    # promise
    queryPromise: null

    set: (@title = '', @content = [], @type = '', @placeholder = '') ->

    setInputMethod: (input = '', suggestionKeys = [], candidateSymbols = []) ->
        @inputMethod =
            input: input
            suggestionKeys: suggestionKeys
            candidateSymbols: candidateSymbols

    query: ->
        # reject old promise if it already exists
        @rejectQuery()
        new Promise (resolve, reject) =>
            @queryPromise =
                resolve: resolve
                reject: reject

    rejectQuery: -> if @queryPromise
        @queryPromise.reject new QueryCancelledError
        delete @queryPromise

    resolveQuery: (message) -> if @queryPromise
        @queryPromise.resolve @queryString
        delete @queryPromise

module.exports = PanelModel
