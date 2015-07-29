Vue     = require 'vue'
_       = require 'lodash'

Vue.component 'panel-body',
    props: ['raw-content', 'title', 'jump-to-goal']
    template: '''
        <div class="agda-panel-content native-key-bindings" tabindex="-1"  v-show="!queryMode">
            <ul class="list-group">
                <li class="list-item text-info" v-repeat="contentHeader">{{$value}}</li>
                <li class="list-item" v-repeat="contentBody">{{$value}}</li>
                <li class="list-item" v-repeat="contentGoal"><template v-if="isGoal"><button class='no-btn text-info' v-on="click: jumpToGoal(index)">{{index}}</button> {{type}}</template><template v-if="!isGoal">{{raw}}</template></li>
            </ul>
        </div>'''
    data: ->
        title: ''
        contentHeader: ['']
        contentBody: []
        contentGoal: []
    computed:
        rawContent:
            set: (raw) ->
                content = raw
                @contentHeader = []
                @contentBody   = []
                @contentGoal   = []

                # divide content into 2 parts and style them differently
                if content.length > 0
                    index = content.indexOf '————————————————————————————————————————————————————————————'
                    sectioned = index isnt -1
                    if sectioned
                        @contentHeader = content.slice 0, index
                        @contentBody   = content.slice index + 1, content.length
                    else
                        @contentBody   = content

                # style goal list differently
                if @title is 'Goals'
                    @contentGoal = @contentBody.map (item) =>
                        result = item.match /^\?(\d*) \: (.*)/
                        if result
                            isGoal: true
                            index: result[1]
                            type: result[2]
                            raw: item
                        else
                            isGoal: false
                            raw: item

                    @contentBody = []

            get: ->
                @contentHeader.concat(@contentBody).concat(@contentGoal)
