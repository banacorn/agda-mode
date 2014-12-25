Agda = require './agda'
Core = require './core'
{log, warn, error} = require './logger'

module.exports =

    configDefaults:
        executablePath: ''
        libraryPath: ''
        logLevel: 0

    activate: (state) ->
        # instantiate and attach Core to each editor
        atom.workspaceView.eachEditorView (editorView) =>
            editor = editorView.getModel()
            if isAgdaFile editor
                # add class .agda to every agda editor
                editorView.addClass 'agda'
                # editor <=> editorView, 2-way binding
                editor.editorView = editorView
                editor.core = new Core editor

        # editor active/inactive event register, fuck Atom's event clusterfuck
        currentEditor = atom.workspace.getActivePaneItem()
        atom.workspace.onDidChangeActivePaneItem (nextEditor) =>
            current = currentEditor.getPath?()
            next = nextEditor.getPath?()
            if next isnt current
                currentEditor?.core?.emit 'deactivate'
                nextEditor?.core?.emit 'activate'
                currentEditor = nextEditor

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
            'agda-mode:input-method'
        ].forEach (command) =>
            atom.workspaceView.command command, =>
                if isAgdaFile()
                    editor = atom.workspace.getActivePaneItem()
                    editor.core[toCamalCase command]()

# if end with ".agda"
isAgdaFile = (editor) ->
    if editor
        filePath = editor.getPath?()
    else
        filePath = atom.workspace.getActivePaneItem().getPath()
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
