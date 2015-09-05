Vue = require 'vue'
Vue.component 'location',
    props: ['location', 'no-float']
    template: '''
        <span class="{{classes}} text-subtle" v-on="click: jump(location)"><template v-if="location.path">{{location.path}}:</template><template v-if="isSameLine">{{location.range.start.row + 1}},{{location.range.start.column + 1}}-{{location.range.end.column + 1}}</template><template v-if="notSameLine">{{location.range.start.row + 1}},{{location.range.start.column + 1}}-{{location.range.end.row + 1}},{{location.range.end.column + 1}}</template></span>
    '''
    methods:
        jump: (location) ->
            @$dispatch 'jump-to-location', location
    computed:
        classes: -> if @noFloat isnt undefined then 'location no-float' else 'location'
        isSameLine: -> @location?.isSameLine is true
        notSameLine: -> @location?.isSameLine is false
