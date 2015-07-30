Vue = require 'vue'
{QueryCancelledError} = require './../error'
Promise = require 'bluebird'
{CompositeDisposable, TextEditor} = require 'atom'

Vue.component 'panel-input-editor',
    inherit: true
    template: '<atom-text-editor mini></atom-text-editor>'
    methods:
        initialize: ->
            # reject old queries
            @$dispatch 'input-editor:cancel'
            # focus the input box (with setTimeout quirk)
            setTimeout => @$el.focus()
            # set placeholder text
            @$el.getModel().setPlaceholderText @placeholderText
        query: ->
            @initialize()
            new Promise (resolve, reject) =>
                @$once 'confirm', (expr) =>
                    console.log expr
                    resolve expr
                @$once 'cancel', =>
                    reject new QueryCancelledError

    ready: ->
        # event clusterfuck
        confirmDisposable = atom.commands.add @$el, 'core:confirm', =>
            @$emit 'confirm', @$el.getModel().getText().trim()     # to local
            @$dispatch 'input-editor:confirm', @$el.getModel().getText().trim() # to parent
        cancelDisposable = atom.commands.add @$el, 'core:cancel', =>
            @$emit 'cancel'
            @$dispatch 'input-editor:cancel'

        # event subscriptions
        @subscriptions = new CompositeDisposable
        @subscriptions.add confirmDisposable
        @subscriptions.add cancelDisposable
    destroyed: ->
        @subscriptions.destroy()
