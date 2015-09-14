_ = require 'lodash'
Vue = require 'vue'
{QueryCancelledError} = require './../error'
Promise = require 'bluebird'
{CompositeDisposable, TextEditor} = require 'atom'

Vue.component 'panel-input-editor',
    template: '<atom-text-editor mini></atom-text-editor>'
    methods:
        initialize: ->
            # set grammar: agda
            textEditor = @$el.getModel()
            agdaGrammar = atom.grammars.grammarForScopeName 'source.agda'
            textEditor.setGrammar agdaGrammar

            # reject old queries
            @$dispatch 'input-editor:cancel'
            # focus the input box (with setTimeout quirk)
            setTimeout => @$el.focus()
            # set placeholder text
            textEditor.setPlaceholderText @placeholderText
        query: ->
            @initialize()
            new Promise (resolve, reject) =>
                @$once 'confirm', (expr) =>
                    resolve expr
                @$once 'cancel', =>
                    reject new QueryCancelledError
        isFocused: ->
            _.contains @$el.classList, 'is-focused'
    ready: ->
        # event clusterfuck
        confirmDisposable = atom.commands.add @$el, 'core:confirm', =>
            expr = @$el.getModel().getText()
                        .replace(/\\/g, '\\\\')
                        .replace(/\"/g, '\\"')
                        .replace(/\n/g, '\\n')
            @$emit 'confirm', expr     # to local
            @$dispatch 'input-editor:confirm', expr # to parent
        cancelDisposable = atom.commands.add @$el, 'core:cancel', =>
            @$emit 'cancel'
            @$dispatch 'input-editor:cancel'

        # event subscriptions
        @subscriptions = new CompositeDisposable
        @subscriptions.add confirmDisposable
        @subscriptions.add cancelDisposable
    destroyed: ->
        @subscriptions.destroy()
