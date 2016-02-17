Core = require './core'
module.exports =
    # https://atom.io/docs/api/latest/Config
    config:
        libraryPath:
            title: 'Libraries'
            description: 'Paths to include (such as agda-stdlib), seperate with comma. Useless after Agda 2.5.0'
            type: 'array'
            default: []
            items:
                type: 'string'
            order: 0
        executablePath:
            title: 'Agda executable path'
            description: 'Overwrite to override (else automatically filled upon first load)'
            type: 'string'
            default: ''
            order: 1
        programName:
            title: 'Agda program name'
            description: """
                The name of the Agda executable, this will be used for execution
                 and automatic path searching
            """
            type: 'string'
            default: 'agda'
            order: 2
        programArgs:
            title: 'Agda program arguments'
            description: """
                Command-line arguments given to the Agda executable.<br>
                Seperate with spaces as you would in command-line, For example:
                `--no-termination-check --no-positivity-check`.<br>
                The flag `--interaction` is always included as the first
                 argument, and does not need to be added here.
            """
            type: 'string'
            default: ''
            order: 3
        backend:
            title: 'Backend'
            description: 'The backend which is used to compile Agda programs.'
            type: 'string'
            default: 'MAlonzo',
            enum: ['MAlonzo', 'MAlonzoNoMain', 'Epic', 'JS']
            order: 4
        highlightingMethod:
            title: 'Highlighting information passing'
            description: 'Receive parsed result from Agda, directly from stdio, or indirectly from temporary files (which requires frequent disk access)'
            type: 'string'
            default: 'Direct',
            enum: ['Indirect', 'Direct']
            order: 5
        panelSize:
            title: 'Panel size'
            description: 'Decides how many rows will be displayed in the panel'
            type: 'integer'
            default: 5
            minimum: 1
            maximum: 20
            order: 6
        inputMethod:
            title: 'Input Method'
            description: 'Enable input method'
            type: 'boolean'
            default: true
            order: 7

    activate: (state) ->
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
                previousEditor.core?.deactivate()
                nextEditor.core?.activate()
                previousEditor = nextEditor
            else
                previousEditor.core?.deactivate()

    commands: [
        'agda-mode:load'
        'agda-mode:quit'
        'agda-mode:restart'
        'agda-mode:compile'
        'agda-mode:toggle-display-of-implicit-arguments'
        'agda-mode:info'
        'agda-mode:solve-constraints'
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
