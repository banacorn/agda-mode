{log, warn, error} = require './logger'
Core = null
module.exports =
    config:
        executablePath:
            title: 'Agda Executable'
            description: 'try "which agda" in your terminal to get the path'
            type: 'string'
            default: ''
            order: 0
        libraryPath:
            title: 'Libraries'
            description: 'paths to include (such as agda-stdlib), seperate with comma'
            type: 'array'
            default: []
            items:
                type: 'string'
            order: 1
        highlightingMethod:
            title: 'Highlighting Information Passing'
            description: 'Receive parsed result from Agda, directly from stdio, or indirectly from temporary files (which requires frequent disk access)'
            type: 'string'
            default: 'Direct',
            enum: ['Indirect', 'Direct']
            order: 2
        inputMethod:
            title: 'Input Method'
            description: 'Enable input method'
            type: 'boolean'
            default: true
            order: 3
        logLevel:
            title: 'Log Level'
            description: 'For purpose of development'
            type: 'string'
            default: 'Error'
            enum: ['Error', 'Warn', 'Debug']
            order: 4

    activate: (state) ->
        Core = require './core'
        atom.workspace.observeTextEditors (editor) =>

            # instantiate core if it's .agda
            @instantiateCore editor if isAgdaFile editor

            editor.onDidChangePath =>
                # agda => not agda
                if editor.core and not isAgdaFile(editor)
                    editorElement = atom.views.getView editor
                    editorElement.classList.remove 'agda'
                    editor.core.destroy()
                    delete editor.core

                # not agda => agda
                if not editor.core and isAgdaFile(editor)
                    @instantiateCore editor

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

    # editor active/inactive event
    registerEditorActivation: ->
        previousEditor = atom.workspace.getActivePaneItem()
        atom.workspace.onDidChangeActivePaneItem (nextEditor) =>
            if nextEditor
                log 'Editor', "#{previousEditor.getPath?()} == switch to => #{nextEditor.getPath?()}"
                previousEditor.core?.deactivate()
                nextEditor.core?.activate()
                previousEditor = nextEditor
            else
                log 'Editor', "#{previousEditor.getPath?()} == switch to => NONE"
                previousEditor.core?.deactivate()

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
