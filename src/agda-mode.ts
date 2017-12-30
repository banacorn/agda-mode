import * as _ from 'lodash';
import { Core, AgdaEditor } from './core';
import * as Action from './view/actions';
import { parseCommand } from './parser';

import { CompositeDisposable } from 'atom';
import * as Atom from 'atom';

const commands = [
    'agda-mode:load',
    'agda-mode:quit',
    'agda-mode:restart',
    'agda-mode:compile',
    'agda-mode:toggle-display-of-implicit-arguments',
    'agda-mode:solve-constraints',
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
    'agda-mode:input-symbol-back-quote',
    'agda-mode:query-symbol',

    'core:undo'
]

let subscriptions = null;

// the opposite of activate, duh
function deactivate() {
    subscriptions.dispose();
}

function isAgdaEditor(editor: Atom.TextEditor | AgdaEditor): editor is AgdaEditor {
    return (<AgdaEditor>editor).core !== undefined;
}

// the "entry point" of the whole package
function activate(state: any) {
    subscriptions = new CompositeDisposable; // gets disposed on deactivated

    // triggered everytime when a new text editor is opened
    subscriptions.add(atom.workspace.observeTextEditors((textEditor: Atom.TextEditor | AgdaEditor) => {
        let textEditorSubscriptions = new CompositeDisposable;

        // plug Core into the TextEditor and make it a AgdaEditor
        // when a new '.agda' or '.lagda' file is opened
        if (isAgdaFile(textEditor))
            toAgdaEditor(textEditor);

        // subscribe to path change in case that `isAgdaFile(textEditor)` changed
        textEditorSubscriptions.add(textEditor.onDidChangePath(() => {
            // agda => not agda
            if (isAgdaEditor(textEditor) && !isAgdaFile(textEditor)) {
                fromAgdaEditor(textEditor);
            }

            // not agda => agda
            if (!isAgdaEditor(textEditor) && isAgdaFile(textEditor)) {
                toAgdaEditor(textEditor);
            }
        }));

        textEditorSubscriptions.add(textEditor.onDidDestroy(() => {
            if (isAgdaEditor(textEditor))
                fromAgdaEditor(<AgdaEditor>textEditor);
            textEditorSubscriptions.dispose();
        }));
    }));

    registerCommands();
    registerEditorActivation();
}

// register keymap bindings and emit commands
function registerCommands() {
    commands.forEach((command) => {
        subscriptions.add(atom.commands.add('atom-text-editor', command, event => {
            const textEditor = atom.workspace.getActiveTextEditor()
            if (isAgdaEditor(textEditor)) {
                const core = textEditor.core;
                // hijack UNDO
                if (command === 'core:undo') {
                    event.stopImmediatePropagation();
                    core.commander.dispatchUndo();
                } else {
                    core.view.store.dispatch(Action.PROTOCOL.clearAll());
                    core.commander.dispatch(parseCommand(command));
                }
            }
        }));
    })
}

// textEditor active/inactive event
function registerEditorActivation() {
    let previousEditor = atom.workspace.getActiveTextEditor();

    // console.log(textEditor.id, previousEditor)
    subscriptions.add(atom.workspace.onDidChangeActiveTextEditor((nextEditor) => {
        // decativate previously activated AgdaEditor
        if (isAgdaEditor(previousEditor))
            previousEditor.core.deactivate();

        // nextEditor may be UNDEFINED (when opening some stuffs)
        if (nextEditor) {
            if (isAgdaEditor(nextEditor))
                nextEditor.core.activate();
            previousEditor = nextEditor;
        }
    }));
}

function fromAgdaEditor(agdaEditor: AgdaEditor) {
    agdaEditor.core.destroy();
    delete agdaEditor.core;
    atom.views.getView(agdaEditor).classList.remove('agda');
}

function toAgdaEditor(textEditor: Atom.TextEditor) {
    // add 'agda' class to TextEditor's element to apply keymaps and styles
    atom.views.getView(textEditor).classList.add('agda');
    (<AgdaEditor>textEditor).core = new Core(textEditor);
}

// if end with '.agda' or '.lagda'
function isAgdaFile(textEditor: Atom.TextEditor | AgdaEditor): boolean {
    const filepath = textEditor.getPath();
    // filenames are case insensitive on Windows
    const onWindows = process.platform === 'win32';
    if (onWindows)
        return /\.agda$|\.lagda$/i.test(filepath);
    else
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
    backend: {
        title: 'Backend',
        description: 'The backend which is used to compile Agda programs.',
        type: 'string',
        default: 'GHCNoMain',
        'enum': ['GHC', 'GHCNoMain'],
        order: 1
    },
    highlightingMethod: {
        title: 'Highlighting information passing',
        description: 'Receive parsed result from Agda, directly from stdio, or indirectly from temporary files (which requires frequent disk access)',
        type: 'string',
        default: 'Direct',
        'enum': ['Indirect', 'Direct'],
        order: 2
    },
    maxBodyHeight: {
        title: 'Max panel size',
        description: 'The max height the panel could strech',
        type: 'integer',
        default: 170,
        minimum: 40,
        maximum: 1010,
        order: 3
    },
    inputMethod: {
        title: 'Input Method',
        description: 'Enable input method',
        type: 'boolean',
        default: true,
        order: 4
    },
    trimSpaces: {
        title: 'Trim spaces',
        description: 'Remove leading and trailing spaces of an expression in an hole, when giving it to Agda. (Default to be False in Emacs, but True in here)',
        type: 'boolean',
        default: true,
        order: 5
    },
    internalState: {
        title: 'Internal state gibberish',
        description: 'Please don\'t touch',
        type: 'string',
        default: JSON.stringify({
            connections: []
        }),
        order: 6
    }
}


export {
    config,
    activate,
    deactivate
}
