{log, warn, error} = require './logger'
Core = null
module.exports =
    config:
        executablePath:
            title: 'Agda Executable'
            description: 'try "which agda" in your terminal to get the path'
            type: 'string'
            default: ''
        libraryPath:
            title: 'Libraries'
            description: 'paths to include (such as agda-stdlib), seperate with comma'
            type: 'array'
            default: []
            items:
                type: 'string'
        inputMethod:
            title: 'Input Method'
            description: 'Enable input method'
            type: 'boolean'
            default: true
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
            description: 'cosmetic surgery on some message such as "ℕ → ℕ → ℕ !=< ℕ of type Set"'
            type: 'boolean'
            default: true

    activate: (state) ->
        Core = require './core'
        atom.workspace.observeTextEditors (editor) =>

            # instantiate core if it's .agda
            @instantiateCore editor if isAgdaFile editor
            # instantiate core if it becomes .agda
            editor.onDidChangePath =>
                if isAgdaFile editor
                    @instantiateCore editor
                else if editor.core
                    editor.core.destroy()
                    editorElement = atom.views.getView editor
                    editorElement.classList.remove 'agda'

        @registerEditorActivation()
        @registerCommands()
        log 'Agda Mode', 'activated'

    instantiateCore: (editor) =>

        # add 'agda' class to the editor element
        # so that keymaps and styles know what to select
        editorElement = atom.views.getView editor
        editorElement.classList.add 'agda'

        editor.core = new Core editor
        subscription = editor.onDidDestroy =>
            editor.core.destroy()
            editorElement.classList.remove 'agda'
            subscription.dispose()
            
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
        'agda-mode:why-in-scope'
        'agda-mode:infer-type[Simplified]'
        'agda-mode:infer-type[Instantiated]'
        'agda-mode:infer-type[Normalised]'
        'agda-mode:module-contents[Simplified]'
        'agda-mode:module-contents[Instantiated]'
        'agda-mode:module-contents[Normalised]'
        'agda-mode:compute-normal-form'
        'agda-mode:compute-normal-form-ignore-abstract'
        'agda-mode:give'
        'agda-mode:refine'
        'agda-mode:auto'
        'agda-mode:case'
        'agda-mode:goal-type[Simplified]'
        'agda-mode:goal-type[Instantiated]'
        'agda-mode:goal-type[Normalised]'
        'agda-mode:context[Simplified]'
        'agda-mode:context[Instantiated]'
        'agda-mode:context[Normalised]'
        'agda-mode:goal-type-and-context[Simplified]'
        'agda-mode:goal-type-and-context[Instantiated]'
        'agda-mode:goal-type-and-context[Normalised]'
        'agda-mode:goal-type-and-inferred-type[Simplified]'
        'agda-mode:goal-type-and-inferred-type[Instantiated]'
        'agda-mode:goal-type-and-inferred-type[Normalised]'
        'agda-mode:input-symbol'
    ]

    # register keymap bindings and emit commands
    registerCommands: ->
        @commands.forEach (command) =>
            atom.commands.add 'atom-text-editor', command, =>
                editor = atom.workspace.getActivePaneItem()
                editor.core.commander.command command
# if end with ".agda"
isAgdaFile = (editor) ->
    if editor
        filepath = editor.getPath?()
    else
        filepath = atom.workspace.getActivePaneItem().getPath()
    /\.agda$|\.lagda$/.test filepath
