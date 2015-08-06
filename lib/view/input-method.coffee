Vue = require 'vue'
_ = require 'lodash'
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
    data: ->
        page: 0
        n: 0
    methods:
        selectKey: (key) ->
            @$dispatch 'select-key', key
        selectSymbol: (symbol) ->
            @$dispatch 'select-symbol', symbol
    computed:
        partialCandidateSymbols: ->
            if @input?.candidateSymbols
                _.take(_.drop(@input.candidateSymbols, @page * 10), 10)
            else
                []


        selectedLeft:   -> _.take(@partialCandidateSymbols, @n)
        selected:       -> [@partialCandidateSymbols[@n]]
        selectedRight:  -> _.drop(@partialCandidateSymbols, @n + 1)
