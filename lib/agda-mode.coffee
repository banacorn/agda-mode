Agda = require './agda'

module.exports =

  configDefaults:
    agdaExecutablePath: ''
    agdaLibraryPath: ''

  activate: (state) ->

    # editor active/inactive event register, fuck Atom's event clusterfuck
    currentEditor = atom.workspaceView.getActivePaneItem()
    atom.workspaceView.on 'pane-container:active-pane-item-changed', (event, nextEditor) =>

      current = currentEditor?.getPath?()
      current ?= 'no path'
      next = nextEditor.getPath?()
      next ?= 'no path'

      if next isnt current
        currentEditor?.emit? 'became-inactive'
        nextEditor.emit? 'became-active'
        currentEditor = nextEditor


    atom.workspaceView.eachEditorView (editorView) =>
      editor = editorView.getModel()
      if @isAgdaFile editor
        editor.agda = new Agda editorView

        # deactivated on default
        editor.agda.syntax.deactivate()
        # make sure that the highlighting is consistent with Agda' state,
        # highlighting on only when loaded and passed.
        #
        # We need to do this because Atom is so fucking slow, it may
        # apply highlighting after we deactivated it.
        editor.on 'grammar-changed', =>
          grammarIsAgda = editor.getGrammar().name is 'Agda'
          shouldHighlight = editor.agda.passed and editor.agda.passed
          if grammarIsAgda and not shouldHighlight
            # fuck you atom
            editor.agda.syntax.deactivate()

        editor.on 'became-active', =>
          editor.agda.emit 'activate'
        editor.on 'became-inactive', =>
          editor.agda.emit 'deactivate'


    # load
    atom.workspaceView.command 'agda-mode:load', =>
      if @isAgdaFile()
        editor = @getTheFuckingEditor()
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

    # next goal
    atom.workspaceView.command 'agda-mode:next-goal', =>
      if @isAgdaFile()
        editor = @getTheFuckingEditor()
        editor.agda.nextGoal()

    # previous goal
    atom.workspaceView.command 'agda-mode:previous-goal', =>
      if @isAgdaFile()
        editor = @getTheFuckingEditor()
        editor.agda.previousGoal()

    # give
    atom.workspaceView.command 'agda-mode:give', =>
      if @isAgdaFile()
        editor = @getTheFuckingEditor()
        editor.agda.give()



  getTheFuckingEditor: ->
    atom.workspace.getActivePaneItem()


  # if end with ".agda"
  isAgdaFile: (editor) ->
    if editor
      filePath = editor.getPath?()
    else
      filePath = @getTheFuckingEditor().getPath()
    /\.agda$/.test filePath


  deactivate: ->
    # @agdaExecutableView.destroy()


  serialize: ->
    # agdaModeViewState: @agdaModeView.serialize()
