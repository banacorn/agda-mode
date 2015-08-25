Vue = require 'vue'
_   = require 'lodash'
require './body/type'

parseHeaderRegex = /^(Goal|Have)\: ((?:\n|.)+)/
parseHeader = (str) ->
    result = str.match parseHeaderRegex
    label: result[1]
    type: result[2]

parseBodyRegex = /(?:^(\?\d+) \: ((?:\n|.)+))|(?:^([^\_].*) \: ((?:\n|.)+))|(?:(?:^Sort (.+))|(?:^(.+) : ([^\[]*))) \[ at (((?:\/[a-zA-Z_\-\s0-9\.]+)+)\.agda\:(?:(\d+)\,(\d+)\-(\d+)|(\d+)\,(\d+)\-(\d+)\,(\d+))) \]/
parseBody = (str) ->
    result = str.match parseBodyRegex
    if result
        # goal
        goalIndex: result[1]
        goalType: result[2]
        # term
        termIndex: result[3]
        termType: result[4]
        # sort
        sortIndex: result[5]
        # meta
        metaIndex: result[6]
        metaType: result[7]
        # location
        location: result[8]
        # filepath: result[8]
        # lineNo: result[9]
        # charStart: result[10]
        # charEnd: result[11]
    else
        value: str

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
                    <button class='no-btn text-info' v-on="click: jumpToGoal(goalIndex)">{{goalIndex}}</button>
                    <span>:</span>
                    <type input="{{goalType}}"></type>
                </li>
                <li class="list-item" v-repeat="body.term">
                    <span class="text-success">{{termIndex}}</span>
                    <span>:</span>
                    <type input="{{termType}}"></type>
                </li>
                <li class="list-item" v-repeat="body.meta">
                    <span class="text-success">{{metaIndex}}</span>
                    <span>:</span>
                    <type input="{{metaType}}"></type><span class="location text-subtle">{{location}}</span>
                </li>
                <li class="list-item" v-repeat="body.sort">
                    <span class="text-highlight">Sort</span> <span class="text-warning">{{sortIndex}}</span><span class="location text-subtle">{{location}}</span>
                </li>
                <li class="list-item" v-repeat="body.value">
                    <type input="{{value}}"></type>
                </li>
                <li class="list-item" v-repeat="body.plainText">
                    <span>{{$value}}</span>
                </li>
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
                if content.type is 'value' or content.type is 'type-judgement'
                    {header, body} = divideContent content.body
                    @header = concatJudgements(header).map parseHeader
                    items = concatJudgements(body).map parseBody
                    @body =
                        goal: _.filter(items, 'goalIndex')
                        term: _.filter(items, 'termIndex')
                        meta: _.filter(items, 'metaIndex')
                        sort: _.filter(items, 'sortIndex')
                        value: _.filter(items, 'value')

                else
                    @header = []
                    @body = plainText: content.body
