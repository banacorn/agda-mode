Vue = require 'vue'
_   = require 'lodash'

Vue.component 'panel-body',
    props: ['raw-content', 'jump-to-goal']
    template: '''
        <div class="agda-panel-content native-key-bindings" tabindex="-1"  v-show="!queryMode">
            <ul class="list-group">
                <li class="list-item text-info" v-repeat="contentHeader">{{$value}}</li>
                <li class="list-item" v-repeat="contentBody"><template v-if="isGoal"><button class='no-btn text-info' v-on="click: jumpToGoal(index)">{{index}}</button> {{type}}</template><template v-if="!isGoal">{{raw}}</template></li>
            </ul>
        </div>'''
    data: ->
        title: ''
        contentHeader: ['']
        contentBody: []
    computed:
        rawContent:
            set: (content) ->
                @contentHeader = []
                @contentBody   = []

                # divide content into 2 parts and style them differently
                if content.length > 0
                    index = content.indexOf '————————————————————————————————————————————————————————————'
                    sectioned = index isnt -1
                    if sectioned
                        @contentHeader = content.slice 0, index
                        @contentBody   = content.slice index + 1, content.length
                    else
                        @contentBody   = content

                @contentBody = @contentBody.map (item) =>
                    result = item.match /^\?(\d*) \: (.*)/
                    if result
                        isGoal: true
                        index: result[1]
                        type: result[2]
                        raw: item
                    else
                        isGoal: false
                        raw: item

            get: ->
                @contentHeader.concat(@contentBody).concat(@contentGoal)
