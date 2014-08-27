AgdaModeView = require './agda-mode-view'

module.exports =
  agdaModeView: null

  activate: (state) ->
    @agdaModeView = new AgdaModeView(state.agdaModeViewState)

  deactivate: ->
    @agdaModeView.destroy()

  serialize: ->
    agdaModeViewState: @agdaModeView.serialize()
