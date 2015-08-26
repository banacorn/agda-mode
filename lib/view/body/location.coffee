Vue = require 'vue'
Vue.component 'location',
    props: ['location']
    template: '''
        <span class="location text-subtle">
            {{location.path}}:<template v-if="location.isSameLine">{{location.rowStart}},{{location.colStart}}-{{location.colEnd}}</template><template v-if="!location.isSameLine">{{location.rowStart}},{{location.colStart}}-{{location.rowEnd}},{{location.colEnd}}</template>
        </span>
    '''
