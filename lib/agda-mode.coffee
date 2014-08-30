AgdaModeView = require './agda-mode-view'
AgdaExecutableView = require './agda-executable-view'
Agda = require './agda'

module.exports =

  activate: (state) ->

    # register agda instance for all agda editor
    atom.workspace.eachEditor (editor) =>
      path = editor.getPath()
      # if end with ".agda"
      if @isAgdaFile
        agda = editor.agda = new Agda editor
        agda.syntax.deactivate()

    # # switch between tabs
    # atom.workspaceView.on 'pane-container:active-pane-item-changed', (event, editor) =>
    #   console.log editor

    atom.workspaceView.command 'agda-mode:load', =>
      editor = atom.workspaceView.getActiveView().editor
      if @isAgdaFile()
        editor.agda.syntax.activate()
    #     console.log atom.workspace.getEditors()
    #     @agdaSyntaxManager.activate()
    #     @agdaExecutableView = new AgdaExecutableView(state.agdaModeViewState)
    #
    # atom.workspaceView.command 'agda-mode:quit', =>
    #
    #   if @isAgdaFile()
    #     @agdaSyntaxManager.deactivate()


    # @agdaModeView = new AgdaModeView(state.agdaModeViewState)

  isAgdaFile: (editor) ->
    editor ?= atom.workspaceView.getActiveView().editor
    path = editor.getPath()
    /\.agda$/.test path
  deactivate: ->
    @agdaExecutableView.destroy()

  serialize: ->
    # agdaModeViewState: @agdaModeView.serialize()
