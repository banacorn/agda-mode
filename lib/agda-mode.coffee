AgdaModeView = require './agda-mode-view'

module.exports =
  # agdaModeView: null

  activate: (state) ->
    # @agdaModeView = new AgdaModeView(state.agdaModeViewState)
    atom.workspaceView.command 'agda-mode:load', =>
      console.log('loading Agda')


  deactivate: ->
    # @agdaModeView.destroy()

  serialize: ->
    # agdaModeViewState: @agdaModeView.serialize()
