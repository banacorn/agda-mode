Vue     = require 'vue'
_       = require 'lodash'
require './view/input-editor'
require './view/input-method'
require './view/body'


template = '''
<div id="head" class="inset-panel padded" v-show="title">
    <panel-title class="text-{{type}}" v-show="!inputMethodMode">{{title}}</panel-title>
    <panel-input-method v-show="inputMethodMode" input="{{inputMethod}}" select-key="{{selectKey}}"></panel-input-method>
</div>
<div id="body" class="padded" v-show="content.length || queryMode">
    <panel-body raw-content="{{content}}" title="{{title}}" jump-to-goal="{{jumpToGoal}}"></panel-body>
    <panel-input-editor v-ref="inputEditor" id="input-editor" v-show="queryMode"></panel-input-editor>
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
            methods:
                setContent: (@title = '', @content = [], @type = '', @placeholderText = '') =>
                    @queryMode      = false

                # returns a Promise
                query: ->

                    # hide input editor and give focus back
                    @$once 'input-editor:confirm', =>
                        @queryMode = false
                        atom.views.getView(atom.workspace.getActiveTextEditor()).focus()
                    @$once 'input-editor:cancel', =>
                        @queryMode = false
                        atom.views.getView(atom.workspace.getActiveTextEditor()).focus()

                    promise = @$.inputEditor.query()

                    # show input box, as it would had been hidden when initialized
                    @queryMode = true

                    return promise
                    
                selectKey: (key) ->
                    core.inputMethod.insertChar key

                jumpToGoal: (index) ->
                    core.textBuffer.jumpToGoal parseInt(index)

module.exports = Panel
