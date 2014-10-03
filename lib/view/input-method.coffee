{View, EditorView} = require 'atom'

# for unicode symbol input
module.exports = class InputMethodView extends View

  @content: ->
    @div class: 'agda-panel tool-panel panel-bottom', =>
      @div outlet: 'panel', class: 'block padded', ''

  initialize: (serializeState) ->

  update: (input, candidateKeys, candidateSymbols) ->
    @panel.text "#{input}[#{candidateKeys.join('')}]"

  attach: (callback) ->
    @panel.text ''
    atom.workspaceView.prependToBottom @
