{EventEmitter} = require 'events'

PanelView = require './view_'

class PanelModel extends EventEmitter
    title: ''
    content: []
    type: ''
    placeholder: ''

    set: (@title = '', @content = [], @type = '', placeholder = '') ->

module.exports = PanelModel
