_ = require 'lodash'
Vue = require 'vue'
{QueryCancelledError} = require './../error'
{parseInputContent} = require './../parser'
Promise = require 'bluebird'
{CompositeDisposable} = require 'atom'

Vue.component 'panel-input-editor',
    template: '<atom-text-editor mini></atom-text-editor>'
    methods:
        initialize: (enableIM) ->
            textEditor = @$el.getModel()
            # set grammar: agda to enable input method
            if enableIM
                agdaGrammar = atom.grammars.grammarForScopeName 'source.agda'
                textEditor.setGrammar agdaGrammar
            else
                textEditor.setGrammar()

            # reject old queries
            @$dispatch 'input-editor:cancel'
            # focus the input box (with setTimeout quirk)
            setTimeout => @$el.focus()
            # set placeholder text
            textEditor.setPlaceholderText @placeholderText
        query: (enableIM) ->
            @initialize enableIM
            new Promise (resolve, reject) =>
                @$once 'confirm', (expr) =>
                    resolve expr
                @$once 'cancel', =>
                    reject new QueryCancelledError
        isFocused: ->
            _.includes @$el.classList, 'is-focused'
    ready: ->
        # event clusterfuck
        confirmDisposable = atom.commands.add @$el, 'core:confirm', =>
            expr = parseInputContent @$el.getModel().getText()
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
