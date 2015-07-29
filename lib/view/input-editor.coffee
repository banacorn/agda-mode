Vue     = require 'vue'
{TextEditorView}      = require 'atom-space-pen-views'
{CompositeDisposable} = require 'atom'

Vue.component 'input-editor',
    inherit: true
    methods:
        initialize: ->
            # reject old queries
            @$dispatch 'input-editor:cancel'

            # focus the input box (with setTimeout quirk)
            setTimeout => @editor.focus()

            @editor.getModel().setPlaceholderText @placeholderText
    ready: ->
        # instantiate and attach element
        @editor = new TextEditorView
            mini: true
        @$el.parentElement.appendChild @editor.element

        # event clusterfuck
        confirmDisposable = atom.commands.add @editor.element, 'core:confirm', =>
            @$dispatch 'input-editor:confirm', @editor.getText().trim()
        cancelDisposable = atom.commands.add @editor.element, 'core:cancel', =>
            @$dispatch 'input-editor:cancel'

        # event subscriptions
        @subscriptions = new CompositeDisposable
        @subscriptions.add confirmDisposable
        @subscriptions.add cancelDisposable
    destroyed: ->
        @subscriptions.destroy()
