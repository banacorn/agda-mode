AgdaModeView = require './agda-mode-view'
AgdaSyntaxManager = require './agda-syntax-manager'

module.exports =

  agdaSyntaxManager: new AgdaSyntaxManager

  activate: (state) ->
    @agdaSyntaxManager.deactivate()
    atom.workspaceView.on 'pane-container:active-pane-item-changed', =>
      @agdaSyntaxManager.deactivate()

    atom.workspaceView.command 'agda-mode:load', =>
      @agdaSyntaxManager.activate()

    atom.workspaceView.command 'agda-mode:quit', =>
      @agdaSyntaxManager.deactivate()

    # @agdaModeView = new AgdaModeView(state.agdaModeViewState)

  deactivate: ->
    # @agdaModeView.destroy()

  serialize: ->
    # agdaModeViewState: @agdaModeView.serialize()
