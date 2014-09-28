{View, EditorView} = require 'atom'

module.exports = class InputBoxView extends View

  @content: ->
    @div class: 'agda-panel tool-panel panel-bottom', =>
      @div outlet: 'header-block', class: 'inset-panel padded', =>
        @span outlet: 'header', 'Normalize expression'
      @div outlet: 'body-block', class: "block padded", =>
        @subview 'inputBox', new EditorView(mini: true, placeholderText: 'expression:')

  initialize: (serializeState) ->
    

  attach: (callback) ->
    atom.workspaceView.prependToBottom @

    # focus on the input box
    @inputBox.focus()

    # on confirm
    @one 'core:confirm', =>
      content = @inputBox.getText()
      callback content if callback
      @detach()

    # cancel or close
    @on 'core:cancel core:close', => @detach()
