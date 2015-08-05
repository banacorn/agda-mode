Vue = require 'vue'
Vue.component 'type',
    props: ['raw']
    template: '''
        <template v-repeat="type">
            <span v-if="unmarked" class="text-highlight">{{unmarked}}</span>
            <button v-if="goal" class='no-btn text-info' v-on="click: jumpToGoal(goal)">{{goal}}</button>
            <span v-if="metea" class="text-success">{{meta}}</span>
            <template v-if="sort">
                <span class="text-highlight">Set </span>
                <span class="text-warning">{{sort}}</span>
            </template>
        </template>
    '''
    methods:
        jumpToGoal: (index) ->
            @$dispatch 'jump-to-goal', index
    computed:
        type: ->
            #                    1       2       3
            tokens = @raw.split(/(\?\d+)|(\_\S+)|Set (\_\S+)/g)
            unmarked = tokens.filter (_, i) => i % 4 is 0
            goals    = tokens.filter (_, i) => i % 4 is 1
            metas    = tokens.filter (_, i) => i % 4 is 2
            sorts    = tokens.filter (_, i) => i % 4 is 3
            unmarked.map (u, i) ->
                unmarked: u
                goal: goals[i]
                meta: metas[i]
                sort: sorts[i]
