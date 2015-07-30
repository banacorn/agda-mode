Vue = require 'vue'

Vue.component 'panel-input-method',
    props: ['input', 'select-key']
    template: '''
        <div id="input-method" >
            <div id="input-buffer" class="inline-block">{{input.rawInput}}</div>
            <div id="suggestion-keys" class="btn-group btn-group-sm">
                <button class="btn" v-repeat="input.suggestionKeys" v-on="click: selectKey($value)">{{$value}}</button>
            </div>
        </div>
        '''
