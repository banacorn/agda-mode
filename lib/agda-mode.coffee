AgdaModeView = require './agda-mode-view'
AgdaExecutableView = require './agda-executable-view'
Agda = require './agda'

module.exports =

  activate: (state) ->

    # register agda instance for all agda editor
    atom.workspace.eachEditor (editor) =>
      # if end with ".agda"
      if @isAgdaFile(editor)
        agda = editor.agda = new Agda editor
        agda.syntax.deactivate()

    # switch between tabs
    atom.workspaceView.on 'pane-container:active-pane-item-changed', (event, editor) =>

    # load
    atom.workspaceView.command 'agda-mode:load', =>

      if @isAgdaFile()
        editor = @getTheFuckingEditor()
        editor.agda.syntax.activate()

    # quit
    atom.workspaceView.command 'agda-mode:quit', =>
      if @isAgdaFile()
        editor = @getTheFuckingEditor()
        editor.agda.syntax.deactivate()

  getTheFuckingEditor: ->
    atom.workspace.getActivePaneItem()

  isAgdaFile: (editor) ->
    if editor
      filePath = editor.getPath()
    else
      filePath = @getTheFuckingEditor().getPath()
    /\.agda$/.test filePath

  deactivate: ->
    @agdaExecutableView.destroy()

  serialize: ->
    # agdaModeViewState: @agdaModeView.serialize()
