Vue = require 'vue'
_   = require 'lodash'

parseType = (str) ->
    tokens = str.split(/(\?\d+)|(\_\S+)|Set (\_\S+)/g)
    unmarked = tokens.filter (_, i) => i % 4 is 0
    goals    = tokens.filter (_, i) => i % 4 is 1
    metas    = tokens.filter (_, i) => i % 4 is 2
    sorts    = tokens.filter (_, i) => i % 4 is 3
    unmarked.map (u, i) ->
        unmarked: u
        goal: goals[i]
        meta: metas[i]
        sort: sorts[i]

parseBodyRegex = /(?:(\?\d+) \: (.+))|(?:(?:Sort (.+))|(?:(.+) : ([^\[]*))) \[ at ((?:\/[a-zA-Z_\-\s0-9\.]+)+)\.agda\:(\d+)\,(\d+)\-(\d+) \]/
parseBody = (str) ->
    result = str.match parseBodyRegex
    if result
        goalTypeSoup = parseType result[2] if result[2]
        metaTypeSoup = parseType result[5] if result[5]
        goalIndex: result[1]
        goalTypeSoup: goalTypeSoup
        sortIndex: result[3]
        metaIndex: result[4]
        metaTypeSoup: metaTypeSoup
        filepath: result[6]
        lineNo: result[7]
        charStart: result[8]
        charEnd: result[9]
    else
        raw: str

Vue.component 'panel-body',
    props: ['raw-content', 'jump-to-goal']
    template: '''
        <div class="agda-panel-content native-key-bindings" tabindex="-1"  v-show="!queryMode">
            <ul class="list-group">
                <li class="list-item text-info" v-repeat="contentHeader">{{$value}}</li>
                <li class="list-item" v-repeat="contentBodyGoals">
                    <button class='no-btn text-info' v-on="click: jumpToGoal(goalIndex)">{{goalIndex}}</button> : <template v-repeat="goalTypeSoup"><span class="text-highlight">{{unmarked}}</span><button class='no-btn text-info' v-on="click: jumpToGoal(goal)">{{goal}}</button><span class="text-success">{{meta}}</span><template v-if="sort"><span class="text-highlight">Set </span><span class="text-warning">{{sort}}</span></template></template>
                </li>
                <li class="list-item" v-repeat="contentBodyMetas">
                    <span class="text-success">{{metaIndex}}</span> : <template v-repeat="metaTypeSoup"><span class="text-highlight">{{unmarked}}</span><button class='no-btn text-info' v-on="click: jumpToGoal(goal)">{{goal}}</button><span class="text-success">{{meta}}</span><template v-if="sort"><span class="text-highlight">Set </span><span class="text-warning">{{sort}}</span></template></template>
                </li>
                <li class="list-item" v-repeat="contentBodySorts">
                    <span class="text-warning">Sort {{sortIndex}}</span><span class="location text-subtle">{{filepath}}:{{lineNo}},{{charStart}}-{{charEnd}}</span>
                </li>
                <li class="list-item" v-repeat="contentBodyOthers">
                    <span>{{raw}}</span>
                </li>
            </ul>
        </div>'''
    data: ->
        title: ''
        contentHeader: ['']
        contentBodyGoals: []
        contentBodyMetas: []
        contentBodySorts: []
        contentBodyOthers: []
    computed:
        rawContent:
            set: (content) ->
                @contentHeader = []
                contentBody = []

                # divide content into 2 parts and style them differently
                if content.length > 0
                    index = content.indexOf '————————————————————————————————————————————————————————————'
                    sectioned = index isnt -1
                    if sectioned
                        @contentHeader = content.slice 0, index
                        contentBody   = content.slice index + 1, content.length
                    else
                        contentBody   = content

                items = contentBody.map parseBody

                @contentBodyGoals = _.filter(items, 'goalIndex')
                @contentBodyMetas = _.filter(items, 'metaIndex')
                @contentBodySorts = _.filter(items, 'sortIndex')
                @contentBodyOthers = _.filter(items, 'raw')
                # console.log @contentBodyGoals
