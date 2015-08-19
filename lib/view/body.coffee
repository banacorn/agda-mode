Vue = require 'vue'
_   = require 'lodash'
require './body/type'

parseHeaderRegex = /^(Goal|Have)\: (.+)/
parseHeader = (str) ->
    result = str.match parseHeaderRegex
    label: result[1]
    type: result[2]

parseBodyRegex = /(?:^(\?\d+) \: ((?:\n|.)+))|(?:^([^\_].*) \: ((?:\n|.)+))|(?:(?:^Sort (.+))|(?:^(.+) : ([^\[]*))) \[ at ((?:\/[a-zA-Z_\-\s0-9\.]+)+)\.agda\:(\d+)\,(\d+)\-(\d+) \]/
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
        filepath: result[8]
        lineNo: result[9]
        charStart: result[10]
        charEnd: result[11]
    else
        raw: str

# concatenate multiline types
concatLines = (lines) ->
    currentLine = 0 # the line we are concatenating to
    result = []
    lines.body.forEach (item, i) ->
        if item.charAt(0) isnt ' '
            currentLine = i
            result[i] = item
        else
            if result[currentLine]
                result[currentLine] = result[currentLine].concat('\n' + item)
            else
                result[currentLine] = item
    return result


            # <ul id="panel-content-header" class="list-group">
            #     <li class="list-item" v-repeat="contentHeader">
            #         <span class="text-info">{{label}}</span><span> : </span>
            #         <type raw="{{content.type}}"></type>
            #     </li>
            # </ul>
Vue.component 'panel-body',
    props: ['content']
    template: '''
        <div class="native-key-bindings" tabindex="-1"  v-show="!queryMode">
            <ul id="panel-content-body" class="list-group">
                <li class="list-item" v-repeat="contentBodyGoals">
                    <button class='no-btn text-info' v-on="click: jumpToGoal(goalIndex)">{{goalIndex}}</button><span> : </span>
                    <type raw="{{goalType}}"></type>
                </li>
                <li class="list-item" v-repeat="contentBodyTerms">
                    <span class="text-success">{{termIndex}}</span><span> : </span>
                    <type raw="{{termType}}"></type>
                </li>
                <li class="list-item" v-repeat="contentBodyMetas">
                    <span class="text-success">{{metaIndex}}</span><span> : </span>
                    <type raw="{{metaType}}"></type>
                </li>
                <li class="list-item" v-repeat="contentBodySorts">
                    <span class="text-warning">Sort {{sortIndex}}</span><span class="location text-subtle">{{filepath}}:{{lineNo}},{{charStart}}-{{charEnd}}</span>
                </li>
                <li class="list-item" v-repeat="contentBodyOthers">
                    <span>{{$value}}</span>
                </li>
            </ul>
        </div>'''
    data: ->
        contentType: ''
        contentHeader: []
        contentBodyGoals: []
        contentBodyTerms: []
        contentBodyMetas: []
        contentBodySorts: []
        contentBodyOthers: []
    methods:
        jumpToGoal: (index) ->
            @$dispatch 'jump-to-goal', index
    computed:
        content:
            set: (content) ->
                # console.log @contentType
                console.log content.type
                console.log content.body

                # if content.type is 'term' or content.type is 'type-judgement'
                #
                # else

                @contentBodyOthers = content.body


                # contentHeader = []
                # contentBodyRaw = []
                # # divide content into 2 parts and style them differently
                # if content.length > 0
                #     index = content.indexOf '————————————————————————————————————————————————————————————'
                #     sectioned = index isnt -1
                #     if sectioned
                #         contentHeader = content.slice 0, index
                #         contentBodyRaw = content.slice index + 1, content.length
                #     else
                #         contentHeader = []
                #         contentBodyRaw = content
                #
                #
                # # header part
                # @contentHeader = contentHeader.map parseHeader
                #
                #
                # # body part
                # items = contentBody.map parseBody
                # @contentBodyGoals = _.filter(items, 'goalIndex')
                # @contentBodyTerms = _.filter(items, 'termIndex')
                # @contentBodyMetas = _.filter(items, 'metaIndex')
                # @contentBodySorts = _.filter(items, 'sortIndex')
                # @contentBodyOthers = _.filter(items, 'raw')
