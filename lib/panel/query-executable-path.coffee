{View, EditorView} = require 'atom'

Q = require 'Q'

class QueryExecutablePath extends View

    @content: ->
        @div class: 'agda-panel tool-panel panel-bottom', =>
            @div outlet: 'header-block', class: 'inset-panel padded', =>
                @span outlet: 'header', 'Given path of Agda executable not found, try "which agda" in your terminal'
            @div outlet: 'body-block', class: "block padded", =>
                @subview 'pathEditor', new EditorView(mini: true, placeholderText: 'Please insert the path here')

    initialize: ->

        # if previousQueryFailed
        #     @header
        #         .text 'Given path not found! Please try again.'
        #         .attr 'class', 'text-error'

        # attach
        atom.workspaceView.prependToBottom @

        # focus on the input box
        @pathEditor.focus()

        @promise = Q.Promise (resolve, reject, notify) =>
            # confirm
            @on 'core:confirm', =>
                @detach()
                resolve @pathEditor.getText()

            # cancel or close
            # @on 'core:cancel core:close', =>
            #     @detach()
            #     reject()

module.exports = QueryExecutablePath
