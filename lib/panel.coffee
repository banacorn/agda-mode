Vue     = require 'vue'
Promise = require 'bluebird'
_       = require 'lodash'
{QueryCancelledError} = require './error'
{TextEditorView}      = require 'atom-space-pen-views'
{CompositeDisposable} = require 'atom'

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
    </div>
</div>
'''
# <li class="list-item" v-repeat="contentGoal"><span class='badge'>{{index}}</span>   {{type}}</li>

class Panel extends Vue

    subscriptions: new CompositeDisposable

    constructor: (core) ->
        editor = new TextEditorView mini: true
        super
            template: template
            data:
                title: ''

                contentHeader: []
                contentBody: []
                contentGoal: []

                type: ''
                placeholder: ''
                queryString: ''
                inputMethodMode: false
                queryMode: false
                inputMethod:
                    rawInput: ''
                    suggestionKeys: []
                    candidateSymbols: []
            methods:
                setContent: (title = '', content = [], type = '', placeholder = '') =>
                    @queryMode      = false
                    @title          = title
                    @content        = content
                    @type           = type
                    @placeholder    = placeholder

                query: () ->
                    # show the input box
                    @queryMode = true
                    # reject old promise if it already exists
                    @rejectQuery()
                    # focus the input box (with setTimeout quirk)
                    setTimeout => @inputEditor.focus()
                    new Promise (resolve, reject) =>
                        @queryPromise =
                            resolve: resolve
                            reject: reject

                rejectQuery: () ->
                    if @queryPromise
                        @queryPromise.reject new QueryCancelledError
                        delete @queryPromise

                resolveQuery: (message) ->
                    if @queryPromise
                        @queryPromise.resolve message
                        delete @queryPromise

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

                    get: () ->
                        @contentHeader.concat(@contentBody).concat(@contentGoal)

            attached: () ->
                @$el.parentElement.querySelector('#input-editor').appendChild(editor.element)
                @inputEditor = editor

                # input editor event subscriptions
                @subscriptions.add atom.commands.add(@inputEditor.element, 'core:confirm', () =>
                    @queryMode = false
                    @resolveQuery @inputEditor.getText().trim()
                    # give focus back
                    atom.views.getView(atom.workspace.getActiveTextEditor()).focus()
                )
                @subscriptions.add atom.commands.add(@inputEditor.element, 'core:cancel', () =>
                    @queryMode = false
                    @rejectQuery()
                    # give focus back
                    atom.views.getView(atom.workspace.getActiveTextEditor()).focus()
                )

    destroy: () ->
        @subscriptions.destroy()

module.exports = Panel
