Vue = require 'vue'
_ = require 'lodash'
{CompositeDisposable} = require 'atom'

Vue.config.debug = true
Vue.component 'panel-input-method',
    props: ['input']
    template: '''
        <div>
            <div id="input-buffer-container">
                <div id="input-buffer" class="inline-block" v-show="rawInput">{{rawInput}}</div>
                <div id="suggestion-keys" class="btn-group btn-group-sm">
                    <button class="btn" v-for="key in suggestionKeys" @click="selectKey(key)">{{key}}</button>
                </div>
            </div>
            <div id="candidate-symbols" class="btn-group btn-group-sm">
                <button class="btn" v-for="symbol in selectedLeft" @click="selectSymbol(symbol)">{{symbol}}</button>
                <button class="btn selected" v-for="symbol in selected" @click="selectSymbol(symbol)">{{symbol}}</button>
                <button class="btn" v-for="symbol in selectedRight" @click="selectSymbol(symbol)">{{symbol}}</button>
            </div>
        </div>
        '''
    ready: ->

        commands =
            'core:move-up' : (event) =>
                if @candidateSymbols?.length isnt 0
                    @moveUp()
                    @replaceSymbol @selected[0]
                    event.stopImmediatePropagation()
            'core:move-right' : (event) =>
                if @candidateSymbols?.length isnt 0
                    @moveRight()
                    @replaceSymbol @selected[0]
                    event.stopImmediatePropagation()
            'core:move-down' : (event) =>
                if @candidateSymbols?.length isnt 0
                    @moveDown()
                    @replaceSymbol @selected[0]
                    event.stopImmediatePropagation()
            'core:move-left' : (event) =>
                if @candidateSymbols?.length isnt 0
                    @moveLeft()
                    @replaceSymbol @selected[0]
                    event.stopImmediatePropagation()

        @subscriptions = atom.commands.add 'atom-text-editor.agda-mode-input-method-activated', commands
    destroy: ->
        @subscriptions.destroy()
    data: ->
        partialCandidateSymbols: []
        suggestionKeys: []
        candidateSymbols: []
        rawInput: ''
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
            if (@index + 10) < @candidateSymbols.length
                @index += 10
        moveLeft: ->
            if (@index - 1) >= 0
                @index -= 1
        moveRight: ->
            if (@index + 1) < @candidateSymbols.length
                @index += 1
    computed:
        input:
            set: (input) ->
                @candidateSymbols = input.candidateSymbols
                @suggestionKeys = input.suggestionKeys
                @rawInput = input.rawInput
                @index = 0
        partialCandidateSymbols: -> _.take(_.drop(@candidateSymbols, @row * 10), 10)
        selectedLeft:   -> _.take(@partialCandidateSymbols, @col)
        selected:       -> _.compact(@partialCandidateSymbols[@col])
        selectedRight:  -> _.drop(@partialCandidateSymbols, @col + 1)

        row: -> Math.floor(@index / 10)
        col: -> @index % 10
