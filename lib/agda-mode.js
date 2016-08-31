"use strict";
var core_1 = require('./core');
var parser_1 = require('./parser');
var commands = [
    'agda-mode:load',
    'agda-mode:quit',
    'agda-mode:restart',
    'agda-mode:compile',
    'agda-mode:toggle-display-of-implicit-arguments',
    'agda-mode:info', 'agda-mode:solve-constraints',
    'agda-mode:show-constraints',
    'agda-mode:show-goals',
    'agda-mode:next-goal',
    'agda-mode:previous-goal',
    'agda-mode:why-in-scope',
    'agda-mode:infer-type[Simplified]',
    'agda-mode:infer-type[Instantiated]',
    'agda-mode:infer-type[Normalised]',
    'agda-mode:module-contents[Simplified]',
    'agda-mode:module-contents[Instantiated]',
    'agda-mode:module-contents[Normalised]',
    'agda-mode:compute-normal-form',
    'agda-mode:compute-normal-form-ignore-abstract',
    'agda-mode:give',
    'agda-mode:refine',
    'agda-mode:auto',
    'agda-mode:case',
    'agda-mode:goal-type[Simplified]',
    'agda-mode:goal-type[Instantiated]',
    'agda-mode:goal-type[Normalised]',
    'agda-mode:context[Simplified]',
    'agda-mode:context[Instantiated]',
    'agda-mode:context[Normalised]',
    'agda-mode:goal-type-and-context[Simplified]',
    'agda-mode:goal-type-and-context[Instantiated]',
    'agda-mode:goal-type-and-context[Normalised]',
    'agda-mode:goal-type-and-inferred-type[Simplified]',
    'agda-mode:goal-type-and-inferred-type[Instantiated]',
    'agda-mode:goal-type-and-inferred-type[Normalised]',
    'agda-mode:input-symbol'
];
// register keymap bindings and emit commands
function registerCommands() {
    commands.forEach(function (command) {
        atom.commands.add('atom-text-editor', command, function () {
            var editor = atom.workspace.getActivePaneItem();
            editor.core.commander.activate(parser_1.parseCommand(command));
        });
    });
}
function activate(state) {
    atom.workspace.observeTextEditors(function (editor) {
        // instantiate core if it's .agda
        if (isAgdaFile(editor))
            instantiateCore(editor);
        editor.onDidChangePath(function () {
            // agda => not agda
            if (editor.core && !isAgdaFile(editor)) {
                var editorElement = atom.views.getView(editor);
                editorElement.classList.remove('agda');
                editor.core.destroy();
                delete editor.core;
            }
            // not agda => agda
            if (!editor.core && isAgdaFile(editor)) {
                instantiateCore(editor);
            }
        });
    });
    registerEditorActivation();
    registerCommands();
}
exports.activate = activate;
function instantiateCore(editor) {
    // add 'agda' class to the editor element
    // so that keymaps and styles know what to select
    var editorElement = atom.views.getView(editor);
    editorElement.classList.add('agda');
    editor.core = new core_1.default(editor);
    var subscription = editor.onDidDestroy(function () {
        editor.core.destroy();
        editorElement.classList.remove('agda');
        subscription.dispose();
    });
}
// editor active/inactive event
function registerEditorActivation() {
    var previousEditor = atom.workspace.getActivePaneItem();
    atom.workspace.onDidChangeActivePaneItem(function (nextEditor) {
        if (nextEditor) {
            if (previousEditor.core)
                previousEditor.core.deactivate();
            if (nextEditor.core)
                nextEditor.core.activate();
            previousEditor = nextEditor;
        }
        else {
            if (previousEditor.core)
                previousEditor.core.deactivate();
        }
    });
}
// if end with '.agda' or '.lagda'
function isAgdaFile(editor) {
    var filepath;
    if (editor && editor.getPath) {
        filepath = editor.getPath();
    }
    else {
        filepath = atom.workspace.getActivePaneItem().getPath();
    }
    return /\.agda$|\.lagda$/.test(filepath);
}
// https://atom.io/docs/api/latest/Config
var config = {
    libraryPath: {
        title: 'Libraries',
        description: 'Paths to include (such as agda-stdlib), seperate with comma. Useless after Agda 2.5.0',
        type: 'array',
        default: [],
        items: {
            type: 'string'
        },
        order: 0
    },
    executablePath: {
        title: 'Agda executable path',
        description: 'Overwrite to override (else automatically filled upon first load)',
        type: 'string',
        default: '',
        order: 1
    },
    programArgs: {
        title: 'Agda program arguments',
        description: 'Command-line arguments given to the Agda executable.<br>\nSeperate with spaces as you would in command-line, For example:\n`--no-termination-check --no-positivity-check`.<br>\nThe flag `--interaction` is always included as the first\n argument, and does not need to be added here.',
        type: 'string',
        default: '',
        order: 2
    },
    autoSearchPath: {
        title: 'Automatically search for executable path',
        description: 'Automatically search for executable path with the program name given below (not working for Windows)',
        type: 'boolean',
        default: true,
        order: 3
    },
    programName: {
        title: 'Agda program name',
        description: 'The name of the Agda executable, this will be used for execution\n and automatic path searching',
        type: 'string',
        default: 'agda',
        order: 4
    },
    backend: {
        title: 'Backend',
        description: 'The backend which is used to compile Agda programs.',
        type: 'string',
        default: 'MAlonzo',
        'enum': ['MAlonzo', 'MAlonzoNoMain', 'Epic', 'JS'],
        order: 5
    },
    highlightingMethod: {
        title: 'Highlighting information passing',
        description: 'Receive parsed result from Agda, directly from stdio, or indirectly from temporary files (which requires frequent disk access)',
        type: 'string',
        default: 'Direct',
        'enum': ['Indirect', 'Direct'],
        order: 6
    },
    maxItemCount: {
        title: 'Max item count',
        description: 'Decides how many rows will be displayed in the panel at a time',
        type: 'integer',
        default: 5,
        minimum: 1,
        maximum: 20,
        order: 7
    },
    inputMethod: {
        title: 'Input Method',
        description: 'Enable input method',
        type: 'boolean',
        default: true,
        order: 8
    },
    trimSpaces: {
        title: 'Trim spaces',
        description: 'Remove leading and trailing spaces of an expression in an hole, when giving it to Agda. (Default to be False in Emacs, but True in here)',
        type: 'boolean',
        default: true,
        order: 9
    }
};
exports.config = config;
//# sourceMappingURL=agda-mode.js.map