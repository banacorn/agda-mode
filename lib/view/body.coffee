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
    props: ['content']
    template: '''
        <div class="native-key-bindings" tabindex="-1"  v-show="!queryMode">
            <ul id="panel-content-header" class="list-group">
                <li class="list-item" v-repeat="contentHeader">
                    <span class="text-info">{{label}}</span>
                    <span>:</span>
                    <type input="{{type}}"></type>
                </li>
            </ul>
            <ul id="panel-content-body" class="list-group">
                <li class="list-item" v-repeat="contentBodyGoals">
                    <button class='no-btn text-info' v-on="click: jumpToGoal(goalIndex)">{{goalIndex}}</button>
                    <span>:</span>
                    <type input="{{goalType}}"></type>
                </li>
                <li class="list-item" v-repeat="contentBodyTerms">
                    <span class="text-success">{{termIndex}}</span>
                    <span>:</span>
                    <type input="{{termType}}"></type>
                </li>
                <li class="list-item" v-repeat="contentBodyMetas">
                    <span class="text-success">{{metaIndex}}</span>
                    <span>:</span>
                    <type input="{{metaType}}"></type><span class="location text-subtle">{{location}}</span>
                </li>
                <li class="list-item" v-repeat="contentBodySorts">
                    <span class="text-highlight">Sort</span> <span class="text-warning">{{sortIndex}}</span><span class="location text-subtle">{{location}}</span>
                </li>
                <li class="list-item" v-repeat="contentBodyValue">
                    <type input="{{value}}"></type>
                </li>
                <li class="list-item" v-repeat="contentPlainText">
                    <span>{{$value}}</span>
                </li>
            </ul>
        </div>'''
    data: ->
        contentHeader: []
        contentBodyGoals: []
        contentBodyTerms: []
        contentBodyMetas: []
        contentBodySorts: []
        contentBodyValue: []
        contentPlainText: []
    methods:
        jumpToGoal: (index) ->
            @$dispatch 'jump-to-goal', index
    computed:
        content:
            set: (content) ->
                if content.type is 'value' or content.type is 'type-judgement'
                    # divide content into 2 parts and style them differently
                    contentHeaderRaw = []
                    contentBodyRaw = []
                    if content.body.length > 0
                        index = content.body.indexOf '————————————————————————————————————————————————————————————'
                        sectioned = index isnt -1
                        if sectioned
                            contentHeaderRaw = content.body.slice 0, index
                            contentBodyRaw = content.body.slice index + 1, content.body.length
                        else
                            contentHeaderRaw = []
                            contentBodyRaw = content.body

                    @contentPlainText = []
                    # header part
                    @contentHeader = concatJudgements(contentHeaderRaw).map parseHeader
                    # body part
                    items = concatJudgements(contentBodyRaw).map parseBody
                    @contentBodyGoals = _.filter(items, 'goalIndex')
                    @contentBodyTerms = _.filter(items, 'termIndex')
                    @contentBodyMetas = _.filter(items, 'metaIndex')
                    @contentBodySorts = _.filter(items, 'sortIndex')
                    @contentBodyValue = _.filter(items, 'value')

                else
                    @contentPlainText = content.body
