Vue     = require 'vue'
_       = require 'lodash'
{QueryCancelledError} = require './error'
require './view/input-editor'


template = '''
<div id="head" class="inset-panel padded" v-show="title">
    <div class="text-{{type}}" v-show="!inputMethodMode">{{title}}</div>
    <div id="input-method" v-show="inputMethodMode">
        <div id="input-buffer" class="inline-block">{{inputMethod.rawInput}}</div>
        <div id="suggestion-keys" class="btn-group btn-group-sm">
            <button class="btn" v-repeat="inputMethod.suggestionKeys" v-on="click: selectKey($value)">{{$value}}</button>
        </div>
    </div>
</div>
<div id="body" class="padded" v-show="content.length || queryMode">
    <div class="agda-panel-content native-key-bindings" tabindex="-1"  v-show="!queryMode">
        <ul class="list-group">
            <li class="list-item text-info" v-repeat="contentHeader">{{$value}}</li>
            <li class="list-item" v-repeat="contentBody">{{$value}}</li>
            <li class="list-item" v-repeat="contentGoal"><template v-if="isGoal"><button class='no-btn text-info' v-on="click: jumpToGoal(index)">{{index}}</button> {{type}}</template><template v-if="!isGoal">{{raw}}</template></li>
        </ul>
    </div>
    <div id="input-editor" v-show="queryMode">
        <input-editor v-ref="inputEditor"></input-editor>
    </div>
</div>
'''

class Panel extends Vue

    constructor: (core) ->
        super
            template: template
            data:
                title: ''

                contentHeader: []
                contentBody: []
                contentGoal: []

                type: ''
                placeholderText: ''
                inputMethodMode: false
                queryMode: false
                inputMethod:
                    rawInput: ''
                    suggestionKeys: []
                    candidateSymbols: []
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

            computed:
                content:
                    set: (raw) ->
                        content = raw

                        @contentHeader = []
                        @contentBody   = []
                        @contentGoal   = []

                        # divide content into 2 parts and style them differently
                        if content.length > 0
                            index = content.indexOf '————————————————————————————————————————————————————————————'
                            sectioned = index isnt -1
                            if sectioned
                                @contentHeader = content.slice 0, index
                                @contentBody   = content.slice index + 1, content.length
                            else
                                @contentBody   = content

                        # style goal list differently
                        if @title is 'Goals'
                            @contentGoal = @contentBody.map (item) =>
                                result = item.match /^\?(\d*) \: (.*)/
                                if result
                                    isGoal: true
                                    index: result[1]
                                    type: result[2]
                                    raw: item
                                else
                                    isGoal: false
                                    raw: item

                            @contentBody = []

                    get: ->
                        @contentHeader.concat(@contentBody).concat(@contentGoal)

module.exports = Panel
