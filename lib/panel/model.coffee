{EventEmitter} = require 'events'
Q = require 'Q'
PanelView = require './view_'

class PanelModel extends EventEmitter

    # data
    title: ''
    content: []
    type: ''
    placeholder: ''
    input: ''

    # flag
    queryOn: false

    set: (@title = '', @content = [], @type = '', placeholder = '') ->

    query: ->
        @queryOn = true
        Q.Promise (resolve, reject, notify) =>
            Object.observe @, (changes) => changes.forEach (change) =>
                if change.name is 'input'
                    resolve @input
                    @queryOn = false

module.exports = PanelModel
