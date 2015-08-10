Vue     = require 'vue'
_       = require 'lodash'
require './view/input-editor'
require './view/input-method'
require './view/body'


template = '''
<div id="panel-header" class="inset-panel padded" v-show="title">
    <panel-title id="panel-title" class="text-{{type}}" v-show="!inputMethodMode">{{title}}</panel-title>
    <panel-input-method id="panel-input-method" v-show="inputMethodMode" input="{{inputMethod}}"></panel-input-method>
</div>
<div id="panel-body" class="padded" v-show="content.length || queryMode">
    <panel-body id="panel-content" raw="{{content}}"></panel-body>
    <panel-input-editor id="panel-input-editor" v-ref="inputEditor" v-show="queryMode"></panel-input-editor>
</div>
'''

class Panel extends Vue

    constructor: (core) ->
        super
            template: template
            data:
                title: ''
                content: []
                type: ''
                placeholderText: ''

                inputMethodMode: false
                queryMode: false

                inputMethod: null
            ready: ->
                @$on 'jump-to-goal', (index) ->
                    core.textBuffer.jumpToGoal parseInt(index.substr(1))
                @$on 'select-key', (key) ->
                    core.inputMethod.insertChar key
                    atom.views.getView(atom.workspace.getActiveTextEditor()).focus()
                @$on 'select-symbol', (symbol) ->
                    core.inputMethod.insertSymbol symbol
                    atom.views.getView(atom.workspace.getActiveTextEditor()).focus()
                @$on 'replace-symbol', (symbol) ->
                    core.inputMethod.replaceString symbol

            methods:
                setContent: (@title = '', @content = [], @type = '', @placeholderText = '') =>
                    @queryMode      = false

                # returns a Promise
                query: ->
                    promise = @$.inputEditor.query()

                    # hide input editor and give focus back
                    @$once 'input-editor:confirm', =>
                        @queryMode = false
                        atom.views.getView(atom.workspace.getActiveTextEditor()).focus()
                    @$once 'input-editor:cancel', =>
                        @queryMode = false
                        atom.views.getView(atom.workspace.getActiveTextEditor()).focus()


                    # show input box, as it would had been hidden when initialized
                    @queryMode = true

                    return promise


module.exports = Panel
