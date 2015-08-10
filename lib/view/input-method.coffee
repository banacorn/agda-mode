Vue = require 'vue'
_ = require 'lodash'
{CompositeDisposable} = require 'atom'

Vue.config.debug = true
Vue.component 'panel-input-method',
    props: ['input']
    template: '''
        <div>
            <div id="input-buffer" class="inline-block">{{input.rawInput}}</div>
            <div id="suggestion-keys" class="btn-group btn-group-sm">
                <button class="btn" v-repeat="input.suggestionKeys" v-on="click: selectKey($value)">{{$value}}</button>
            </div>
            <div id="candidate-symbols" class="btn-group btn-group-sm">
                <button class="btn" v-repeat="selectedLeft" v-on="click: selectSymbol($value)">{{$value}}</button>
                <button class="btn selected" v-repeat="selected" v-on="click: selectSymbol($value)">{{$value}}</button>
                <button class="btn" v-repeat="selectedRight" v-on="click: selectSymbol($value)">{{$value}}</button>
            </div>
        </div>
        '''
    ready: ->

        commands =
            'core:move-up' : (event) =>
                if @input? and @input?.candidateSymbols.length isnt 0
                    @moveUp()
                    @replaceSymbol @selected[0]
                    event.stopImmediatePropagation()
            'core:move-right' : (event) =>
                if @input? and @input?.candidateSymbols.length isnt 0
                    @moveRight()
                    @replaceSymbol @selected[0]
                    event.stopImmediatePropagation()
            'core:move-down' : (event) =>
                if @input? and @input?.candidateSymbols.length isnt 0
                    @moveDown()
                    @replaceSymbol @selected[0]
                    event.stopImmediatePropagation()
            'core:move-left' : (event) =>
                if @input? and @input?.candidateSymbols.length isnt 0
                    @moveLeft()
                    @replaceSymbol @selected[0]
                    event.stopImmediatePropagation()

        @subscriptions = atom.commands.add 'atom-text-editor.agda-mode-input-method-activated', commands
    destroy: ->
        @subscriptions.destroy()
    data: ->
        subscriptions: new CompositeDisposable
        index: 0
    methods:
        selectKey: (key) ->
            @$dispatch 'select-key', key
        selectSymbol: (symbol) ->
            @$dispatch 'select-symbol', symbol
        replaceSymbol: (symbol) ->
            @$dispatch 'replace-symbol', symbol
        moveUp: ->
            if (@index - 10) >= 0
                @index -= 10
        moveDown: ->
            if (@index + 10) < @input.candidateSymbols.length
                @index += 10
        moveLeft: ->
            if (@index - 1) >= 0
                @index -= 1
        moveRight: ->
            if (@index + 1) < @input.candidateSymbols.length
                @index += 1
    computed:
        partialCandidateSymbols: ->
            if @input?.candidateSymbols
                _.take(_.drop(@input.candidateSymbols, @row * 10), 10)
            else
                []

        selectedLeft:   -> _.take(@partialCandidateSymbols, @col)
        selected:       -> _.compact(@partialCandidateSymbols[@col])
        selectedRight:  -> _.drop(@partialCandidateSymbols, @col + 1)

        row: -> Math.floor(@index / 10)
        col: -> @index % 10
