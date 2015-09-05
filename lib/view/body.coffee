Vue = require 'vue'
_   = require 'lodash'
require './body/type'
require './body/location'
require './body/error'
parser = require './body/parser'

# divide content into header and body
# divideContent : [String] -> { header :: [String], body :: [String] }
divideContent = (content) ->

    notEmpty = content.length > 0
    index = content.indexOf '————————————————————————————————————————————————————————————'
    isSectioned = index isnt -1

    if notEmpty and isSectioned
        header: content.slice 0, index
        body: content.slice index + 1, content.length
    else
        header: []
        body: content

# concatenate multiline judgements
concatJudgements = (lines) ->
    lineStartRegex = /^(?:Goal|Have|.+ )\:|Sort /
    result = []
    currentLine = 0
    lines.forEach (item, i) ->
        if item.match lineStartRegex
            currentLine = i
            result[currentLine] = item
        else
            if result.length is 0 # predicate only, no subject
                result[currentLine] = item
            else
                result[currentLine] = result[currentLine].concat('\n' + item)
    return _.compact result

Vue.component 'panel-body',
    props: ['raw-content']
    template: '''
        <div class="native-key-bindings" tabindex="-1"  v-show="!queryMode">
            <ul id="panel-content-header" class="list-group">
                <li class="list-item" v-repeat="header">
                    <span class="text-info">{{label}}</span>
                    <span>:</span>
                    <type input="{{type}}"></type>
                </li>
            </ul>
            <ul id="panel-content-body" class="list-group">
                <li class="list-item" v-repeat="body.goal">
                    <button class='no-btn text-info' v-on="click: jumpToGoal(index)">{{index}}</button>
                    <span>:</span>
                    <type input="{{type}}"></type>
                </li>
                <li class="list-item" v-repeat="body.judgement">
                    <span class="text-success">{{expr}}</span>
                    <span v-if="index">:</span>
                    <type input="{{type}}"></type>
                </li>
                <li class="list-item" v-repeat="body.term">
                    <type input="{{expr}}"></type>
                </li>
                <li class="list-item" v-repeat="body.meta">
                    <span class="text-success">{{index}}</span>
                    <span>:</span>
                    <type input="{{type}}"></type>
                    <location location="{{location}}"></location>
                </li>
                <li class="list-item" v-repeat="body.sort">
                    <span class="text-highlight">Sort</span> <span class="text-warning">{{index}}</span>
                    <location location="{{location}}"></location>
                </li>
                <li class="list-item" v-repeat="body.plainText">
                    <span>{{$value}}</span>
                </li>
                <error v-if="body.error" error="{{body.error}}"></error>
            </ul>
        </div>'''
    data: ->
        header: null
        body: null
    methods:
        jumpToGoal: (index) ->
            @$dispatch 'jump-to-goal', index
    computed:
        rawContent:
            set: (content) ->
                switch content.type
                    when 'value', 'type-judgement'
                        {header, body} = divideContent content.body

                        @header = concatJudgements(header).map parser.parseHeader
                        items = concatJudgements(body).map(parser.parseJudgement)
                        @body =
                            goal: _.filter(items, judgementType: 'goal')
                            judgement: _.filter(items, judgementType: 'type judgement')
                            term: _.filter(items, judgementType: 'term')
                            meta: _.filter(items, judgementType: 'meta')
                            sort: _.filter(items, judgementType: 'sort')
                    when 'error'
                        @header = []
                        @body = error: parser.parseError(content.body)
                    else
                        @header = []
                        @body = plainText: content.body
