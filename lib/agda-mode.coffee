AgdaModeView = require './agda-mode-view'
AgdaSyntaxManager = require './agda-syntax-manager'

module.exports =

  agdaSyntaxManager: new AgdaSyntaxManager
  # agdaModeView: null

  activate: (state) ->

    @agdaSyntaxManager.start()

    # @agdaModeView = new AgdaModeView(state.agdaModeViewState)
    
  deactivate: ->
    # @agdaModeView.destroy()

  serialize: ->
    # agdaModeViewState: @agdaModeView.serialize()
