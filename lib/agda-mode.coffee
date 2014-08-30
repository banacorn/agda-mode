AgdaModeView = require './agda-mode-view'
AgdaExecutableView = require './agda-executable-view'
Agda = require './agda'

module.exports =

  activate: (state) ->

    # register agda instance for all agda editor
    atom.workspace.eachEditor (editor) =>
      path = editor.getPath()
      # if end with ".agda"
      if /\.agda$/.test path
        editor.agda = new Agda

    # # first time loaded
    # if @isAgdaFile()
    #   @agdaSyntaxManager.deactivate()
    #
    # # switch between tabs
    # atom.workspaceView.on 'pane-container:active-pane-item-changed', =>
    #   if @isAgdaFile()
    #     @agdaSyntaxManager.deactivate()
    #
    # atom.workspaceView.command 'agda-mode:load', =>
    #
    #   if @isAgdaFile()
    #     console.log atom.workspace.getEditors()
    #     @agdaSyntaxManager.activate()
    #     @agdaExecutableView = new AgdaExecutableView(state.agdaModeViewState)
    #
    # atom.workspaceView.command 'agda-mode:quit', =>
    #
    #   if @isAgdaFile()
    #     @agdaSyntaxManager.deactivate()


    # @agdaModeView = new AgdaModeView(state.agdaModeViewState)

  deactivate: ->
    @agdaExecutableView.destroy()

  serialize: ->
    # agdaModeViewState: @agdaModeView.serialize()
