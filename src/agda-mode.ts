import * as _ from 'lodash';
import Core from './core';
import { parseCommand } from './parser';

declare var atom: any;
var { Range, CompositeDisposable } = require('atom');


const commands = [
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
    'agda-mode:toggle-docking',
    'agda-mode:why-in-scope',
    'agda-mode:infer-type[Simplified]',
    'agda-mode:infer-type[Instantiated]',
    'agda-mode:infer-type[Normalised]',
    'agda-mode:module-contents[Simplified]',
    'agda-mode:module-contents[Instantiated]',
    'agda-mode:module-contents[Normalised]',
    'agda-mode:compute-normal-form[DefaultCompute]',
    'agda-mode:compute-normal-form[IgnoreAbstract]',
    'agda-mode:compute-normal-form[UseShowInstance]',
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
    'agda-mode:input-symbol',
    'agda-mode:input-symbol-curly-bracket',
    'agda-mode:input-symbol-bracket',
    'agda-mode:input-symbol-parenthesis',
    'agda-mode:input-symbol-double-quote',
    'agda-mode:input-symbol-single-quote',
    'agda-mode:input-symbol-back-quote'
]

let subscriptions = null;

// register keymap bindings and emit commands
function registerCommands() {
    commands.forEach((command) => {
        subscriptions.add(atom.commands.add('atom-text-editor', command, () => {
            const paneItem = atom.workspace.getActivePaneItem()
            let editor = null;
            // since the pane item may be a spawned agda view
            if (_.includes(paneItem.classList, 'agda-view') && paneItem.getEditor) {
                editor = paneItem.getEditor();
            } else {
                editor = paneItem;
            }
            // console.log(`[${editor.id}] ${command}`)
            editor.core.commander.activate(parseCommand(command));
        }));
    })
}

// editor active/inactive event
function registerEditorActivation() {
    let previousEditor = atom.workspace.getActivePaneItem();
    // console.log(editor.id, previousEditor)
    subscriptions.add(atom.workspace.onDidChangeActivePaneItem((nextEditor) => {
        if (nextEditor) {
            if (previousEditor.core)
                previousEditor.core.deactivate();
            if (nextEditor.core)
                nextEditor.core.activate();
            previousEditor = nextEditor;
        } else {
            if (previousEditor.core)
                previousEditor.core.deactivate();
        }
    }));
}

function deactivate() {
    subscriptions.dispose();
}

function activate(state: any) {
    subscriptions = new CompositeDisposable;
    subscriptions.add(atom.workspace.observeTextEditors((editor) => {
        let editorSubscriptions = new CompositeDisposable
        // instantiate core if it's .agda
        if (isAgdaFile(editor))
            instantiateCore(editor);

        editorSubscriptions.add(editor.onDidChangePath(() => {
            // agda => not agda
            if (editor.core && !isAgdaFile(editor)) {
                const editorElement = atom.views.getView(editor);
                editorElement.classList.remove('agda');
                editor.core.destroy();
                delete editor.core;
            }

            // not agda => agda
            if (!editor.core && isAgdaFile(editor)) {
                instantiateCore(editor);
            }
        }));

        editorSubscriptions.add(editor.onDidDestroy(() => {
            editorSubscriptions.dispose();
        }))
    }));

    registerCommands();
    registerEditorActivation();
}

function instantiateCore(editor) {
    // add 'agda' class to the editor element
    // so that keymaps and styles know what to select
    const editorElement = atom.views.getView(editor);
    editorElement.classList.add('agda');
    editor.core = new Core(editor);
    const editorSubscriptions = editor.onDidDestroy(() => {
        editor.core.destroy();
        editorElement.classList.remove('agda');
        editorSubscriptions.dispose();
    });
}



// if end with '.agda' or '.lagda'
function isAgdaFile(editor): boolean {
    let filepath: string;
    if (editor && editor.getPath) {
        filepath = editor.getPath();
    } else {
        filepath = atom.workspace.getActivePaneItem().getPath();
    }
    return /\.agda$|\.lagda$/.test(filepath);
}

// https://atom.io/docs/api/latest/Config
const config = {
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
    maxBodyHeight: {
        title: 'Max panel size',
        description: 'The max height the panel could strech',
        type: 'integer',
        default: 170,
        minimum: 40,
        maximum: 1010,
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
}


export {
    config,
    activate,
    deactivate
}
