Vue     = require 'vue'
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
    ready: ->
        # event clusterfuck
        confirmDisposable = atom.commands.add @$el, 'core:confirm', =>
            @$dispatch 'input-editor:confirm', @$el.getModel().getText().trim()
        cancelDisposable = atom.commands.add @$el, 'core:cancel', =>
            @$dispatch 'input-editor:cancel'

        # event subscriptions
        @subscriptions = new CompositeDisposable
        @subscriptions.add confirmDisposable
        @subscriptions.add cancelDisposable
    destroyed: ->
        @subscriptions.destroy()
