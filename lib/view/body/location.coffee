Vue = require 'vue'
Vue.component 'location',
    props: ['location', 'no-float']
    template: '''
        <span class="{{classes}} text-subtle" v-on="click: jump(location)">{{location.path}}:<template v-if="location.isSameLine">{{location.rowStart}},{{location.colStart}}-{{location.colEnd}}</template><template v-if="!location.isSameLine">{{location.rowStart}},{{location.colStart}}-{{location.rowEnd}},{{location.colEnd}}</template></span>
    '''
    methods:
        jump: (location) ->
            @$dispatch 'jump-to-location', location
    computed:
        classes: -> if @noFloat isnt undefined then 'location no-float' else 'location'
