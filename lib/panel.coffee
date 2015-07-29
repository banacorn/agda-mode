Vue     = require 'vue'
_       = require 'lodash'
{QueryCancelledError} = require './error'
Promise = require 'bluebird'
require './view/input-editor'
require './view/input-method'
require './view/body'


template = '''
<div id="head" class="inset-panel padded" v-show="title">
    <div class="text-{{type}}" v-show="!inputMethodMode">{{title}}</div>
    <panel-input-method v-show="inputMethodMode" input="{{inputMethod}}" select-key="{{selectKey}}"></panel-input-method>
</div>
<div id="body" class="padded" v-show="content.length || queryMode">
    <panel-body raw-content="{{content}}" title="{{title}}" jump-to-goal="{{jumpToGoal}}"></panel-body>
    <div id="input-editor" v-show="queryMode">
        <input-editor v-ref="inputEditor"></input-editor>
    </div>
</div>
'''

Vue.component 'panel-input-method',
    props: ['input', 'select-key']
    template: '''
        <div id="input-method" >
            <div id="input-buffer" class="inline-block">{{input.rawInput}}</div>
            <div id="suggestion-keys" class="btn-group btn-group-sm">
                <button class="btn" v-repeat="input.suggestionKeys" v-on="click: selectKey($value)">{{$value}}</button>
            </div>
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
                    # initialize the input editor component
                    @$.inputEditor.initialize()
                    # show input box, as it would had been hidden when initialized
                    @queryMode = true

                    new Promise (resolve, reject) =>
                        @$once 'input-editor:confirm', (expr) =>
                            resolve expr
                            @queryMode = false
                            atom.views.getView(atom.workspace.getActiveTextEditor()).focus()
                        @$once 'input-editor:cancel', =>
                            reject new QueryCancelledError
                            @queryMode = false
                            atom.views.getView(atom.workspace.getActiveTextEditor()).focus()

                selectKey: (key) ->
                    core.inputMethod.insertChar key

                jumpToGoal: (index) ->
                    core.textBuffer.jumpToGoal parseInt(index)

module.exports = Panel
