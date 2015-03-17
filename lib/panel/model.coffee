{EventEmitter} = require 'events'
Q = require 'Q'
PanelView = require './view_'

class PanelModel extends EventEmitter
    title: ''
    content: []
    type: ''
    placeholder: ''

    set: (@title = '', @content = [], @type = '', placeholder = '') ->

    query: ->
        promise = Q.Promise (resolve, reject, notify) =>
            @on 'reply', (data) => resolve data
        @emit 'query'
        return promise

module.exports = PanelModel
