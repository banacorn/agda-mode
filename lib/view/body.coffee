Vue = require 'vue'
_   = require 'lodash'
require './body/type'

regexHeader = /^(Goal|Have)\: ((?:\n|.)+)/
parseHeader = (str) ->
    result = str.match regexHeader
    label: result[1]
    type: result[2]

regexLocation = /((?:\n|.)*\S+)\s*\[ at (.+):(?:(\d+)\,(\d+)\-(\d+)\,(\d+)|(\d+)\,(\d+)\-(\d+)) \]/
parseLocation = (str) ->
    result = str.match regexLocation
    if result
        body: result[1]
        location:
            path: result[2]
            rowStart: if result[3] then result[3] else result[7]
            rowEnd: if result[5] then result[5] else result[7]
            colStart: if result[4] then result[4] else result[8]
            colEnd: if result[6] then result[6] else result[9]

regexGoal = /^(\?\d+) \: ((?:\n|.)+)/
parseGoal = (str) ->
    result = str.match regexGoal
    if result
        index: result[1]
        body: result[2]
        type: 'goal'

regexTerm = /^([^\_\?].*) \: ((?:\n|.)+)/
parseTerm = (str) ->
    result = str.match regexTerm
    if result
        index: result[1]
        body: result[2]
        type: 'term'

regexMeta = /^(.+) \: ((?:\n|.)+)/
parseMeta = (str) ->
    {body, location} = parseLocation str
    result = body.match regexMeta
    if result
        index: result[1]
        body: result[2]
        location: location
        type: 'meta'

regexSort = /^Sort ((?:\n|.)+)/
parseSort = (str) ->
    {body, location} = parseLocation str
    result = body.match regexSort
    if result
        index: result[1]
        location: location
        type: 'sort'

parseBody = (str) -> parseGoal(str) || parseTerm(str) || parseMeta(str) || parseSort(str)

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
                    <type input="{{body}}"></type>
                </li>
                <li class="list-item" v-repeat="body.term">
                    <span class="text-success">{{index}}</span>
                    <span>:</span>
                    <type input="{{body}}"></type>
                </li>
                <li class="list-item" v-repeat="body.meta">
                    <span class="text-success">{{index}}</span>
                    <span>:</span>
                    <type input="{{body}}"></type><span class="location text-subtle">{{location}}</span>
                </li>
                <li class="list-item" v-repeat="body.sort">
                    <span class="text-highlight">Sort</span> <span class="text-warning">{{index}}</span><span class="location text-subtle">{{location}}</span>
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

                    items = concatJudgements(body).map(parseBody)
                    @body =
                        goal: _.filter(items, type: 'goal')
                        term: _.filter(items, type: 'term')
                        meta: _.filter(items, type: 'meta')
                        sort: _.filter(items, type: 'sort')

                else
                    @header = []
                    @body = plainText: content.body
