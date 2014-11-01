Agda = require './agda'
Core = require './core'

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
      next = nextEditor?.getPath?()
      next ?= 'no path'

      if next isnt current
        currentEditor?.emit? 'became-inactive'
        nextEditor?.emit? 'became-active'
        currentEditor = nextEditor


    atom.workspaceView.eachEditorView (editorView) =>
      editor = editorView.getModel()
      if isAgdaFile editor

        # add class .agda to every agda editor
        editorView.addClass 'agda'
        
        new Core editor
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
          shouldHighlight = editor.agda.loaded and editor.agda.passed
          if grammarIsAgda and not shouldHighlight
            # fuck you atom
            editor.agda.syntax.deactivate()

        editor.on 'became-active', =>
          editor.agda.emit 'activate'
        editor.on 'became-inactive', =>
          editor.agda.emit 'deactivate'

    # register commands
    [
      'agda-mode:load'
      'agda-mode:quit'
      'agda-mode:restart'
      'agda-mode:next-goal'
      'agda-mode:previous-goal'
      'agda-mode:give'
      'agda-mode:goal-type'
      'agda-mode:context'
      'agda-mode:goal-type-and-context'
      'agda-mode:goal-type-and-inferred-type'
      'agda-mode:refine'
      'agda-mode:case'
      'agda-mode:auto'
      'agda-mode:normalize'
      'agda-mode:input'
    ].forEach registerCommand


  deactivate: ->
    # @agdaExecutableView.destroy()
  serialize: ->
    # agdaModeViewState: @agdaModeView.serialize()


registerCommand = (command) =>
  atom.workspaceView.command command, =>
    if isAgdaFile()
      editor = getTheFuckingEditor()
      editor.agda[toCamalCase command]()

getTheFuckingEditor = ->
  atom.workspace.getActivePaneItem()


# if end with ".agda"
isAgdaFile = (editor) ->
  if editor
    filePath = editor.getPath?()
  else
    filePath = getTheFuckingEditor().getPath()
  /\.agda$/.test filePath


toCamalCase = (str) ->
  str
    .substr(10)   # strip "agda-mode:"
    .split('-')
    .map (str, i) =>
      if i is 0
        str
      else
        str.charAt(0).toUpperCase() + str.slice(1)
    .join('')
