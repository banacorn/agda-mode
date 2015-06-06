Core = require './core'
{log, warn, error} = require './logger'
{$} = require 'atom-space-pen-views'

module.exports =

    config:
        executablePath:
            title: 'Agda Executable'
            description: 'try "which agda" in your terminal to get the path'
            type: 'string'
            default: ''
        libraryPath:
            title: 'Libraries'
            description: 'paths to include (such as agda-stdlib), eperate with comma'
            type: 'array'
            default: []
            items:
                type: 'string'
        logLevel:
            title: 'Log Level'
            description: '0: error, 1: warn, 2: debug'
            type: 'integer'
            default: 0
        directHighlighting:
            title: 'Direct Highlighting'
            description: 'Receive the parsing result from Agda, directly from stdio, or indirectly from temporary files (which requires frequent disk access)'
            type: 'boolean'
            default: true
        improveMessage:
            title: 'Improve Message'
            description: 'no cosmetic surgery on some message such as "ℕ → ℕ → ℕ !=< ℕ of type Set"'
            type: 'boolean'
            default: false

    activate: (state) ->
        atom.workspace.observeTextEditors @instantiateCore
        @registerEditorActivation()
        @registerCommands()


    instantiateCore: (editor) =>

        instantiate = =>

            editorElement = atom.views.getView editor

            if editor.core
                # if the file is not .agda anymore,
                # and there exists a core, then destroy it
                editor.core.destroy()
                $(editorElement).removeClass 'agda'

            else if isAgdaFile editor

                # add 'agda' class to the editor element
                # so that keymaps and styles know what to select

                $(editorElement).addClass 'agda'

                editor.core = new Core editor
                ev = editor.onDidDestroy =>
                    editor.core.destroy()
                    ev.dispose()

        instantiate()
        editor.onDidChangePath => instantiate()

    # editor active/inactive event register, fuck Atom's event clusterfuck
    registerEditorActivation: ->
        currentEditor = atom.workspace.getActivePaneItem()
        atom.workspace.onDidChangeActivePaneItem (nextEditor) =>
            current = currentEditor?.getPath?()
            next = nextEditor?.getPath?()
            if next isnt current
                currentEditor?.core?.deactivate()
                nextEditor?.core?.activate()
                currentEditor = nextEditor
                log 'Editor', "#{current} => #{next}"


    commands: [
        'agda-mode:load'
        'agda-mode:quit'
        'agda-mode:restart'
        'agda-mode:compile'
        'agda-mode:toggle-display-of-implicit-arguments'
        'agda-mode:show-constraints'
        'agda-mode:show-goals'
        'agda-mode:next-goal'
        'agda-mode:previous-goal'
        'agda-mode:infer-type'
        'agda-mode:infer-type-normalized'
        'agda-mode:module-contents'
        'agda-mode:give'
        'agda-mode:goal-type'
        'agda-mode:context'
        'agda-mode:goal-type-and-context'
        'agda-mode:goal-type-and-inferred-type'
        'agda-mode:refine'
        'agda-mode:case'
        'agda-mode:auto'
        'agda-mode:normalize'
        'agda-mode:input-symbol'
    ]


    # register keymap bindings and emit commands
    registerCommands: ->
        @commands.forEach (command) =>
            atom.commands.add 'atom-text-editor.agda', command, =>
                if isAgdaFile()
                    editor = atom.workspace.getActivePaneItem()
                    editor.core[toCamalCase command]()


# if end with ".agda"
isAgdaFile = (editor) ->
    if editor
        filepath = editor.getPath?()
    else
        filepath = atom.workspace.getActivePaneItem().getPath()
    /\.agda$|\.lagda$/.test filepath

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
