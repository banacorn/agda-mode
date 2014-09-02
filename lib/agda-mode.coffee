Agda = require './agda'

module.exports =

  configDefaults:
    agdaExecutablePath: ''
    agdaLibraryPath: ''

  activate: (state) ->

    # load
    atom.workspaceView.command 'agda-mode:load', =>
      if @isAgdaFile()
        editor = @getTheFuckingEditor()
        editor.agda ?= new Agda editor
        editor.agda.load()


    # quit
    atom.workspaceView.command 'agda-mode:quit', =>
      if @isAgdaFile()
        editor = @getTheFuckingEditor()
        editor.agda.quit()


    # restart
    atom.workspaceView.command 'agda-mode:restart', =>
      if @isAgdaFile()
        editor = @getTheFuckingEditor()
        editor.agda.restart()


  getTheFuckingEditor: ->
    atom.workspace.getActivePaneItem()


  # if end with ".agda"
  isAgdaFile: (editor) ->
    if editor
      filePath = editor.getPath()
    else
      filePath = @getTheFuckingEditor().getPath()
    /\.agda$/.test filePath


  deactivate: ->
    # @agdaExecutableView.destroy()


  serialize: ->
    # agdaModeViewState: @agdaModeView.serialize()
