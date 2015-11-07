Vue     = require 'vue'
_       = require 'lodash'
require './view/input-editor'
require './view/input-method'
require './view/body'

# toStyle : ContentType -> TextStyle
toStyle = (type) ->
    switch type
        when 'error' then 'error'
        when 'warning' then 'warning'
        when 'type-judgement' then 'info'   # term : type
        when 'value' then 'success'
        when 'plain-text' then ''
        else ''

Panel = Vue.extend
    template: '''
        <div id="panel-header" class="inset-panel padded">
            <div id="panel-title" class="text-{{style}}" v-show="!inputMethodMode">{{content.title}}</div>
            <panel-input-method id="panel-input-method" v-show="inputMethodMode" :input="inputMethod"></panel-input-method>
        </div>
        <div id="panel-body" class="padded" v-show="content.body.length || queryMode">
            <panel-body id="panel-content" :raw-content="content"></panel-body>
            <panel-input-editor id="panel-input-editor" v-ref:input-editor v-show="queryMode"></panel-input-editor>
        </div>
        '''

    data: ->
        content:
            title: ''
            body: []
            type: null
            placeholder: ''
        inputMethodMode: false
        queryMode: false
        inputMethod: null
        style: ''

    methods:
        setContent: (title = '', body = [], type = 'plain-text', placeholder = '') ->
            @content =
                title: title
                body: body
                type: type
                placeholder: placeholder
            @queryMode = false
            @style = toStyle type

        # returns a Promise
        query: (enableIM = true) ->
            promise = @$refs.inputEditor.query enableIM

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

Vue.component 'agda-panel', Panel
module.exports = Panel
