Vue = require 'vue'

Vue.component 'type',
    props: ['input']
    template: '''
        <div class="type"><template v-for="item in type"><span v-if="item.unmarked" class="text-highlight">{{item.unmarked}}</span><button v-if="item.goal" class='no-btn text-info' @click="jumpToGoal(item.goal)">{{item.goal}}</button><span v-if="item.meta" class="text-success">{{item.meta}}</span><template v-if="item.sort"><span class="text-highlight">Set </span><span class="text-warning">{{item.sort}}</span></template></template></div>
    '''
    methods:
        jumpToGoal: (index) ->
            @$dispatch 'jump-to-goal', index
    computed:
        type: ->
            #                    1       2            3
            tokens = @input.split(/(\?\d+)|(\_[^\.]\S*)|Set (\_\S+)/g)
            unmarked = tokens.filter (_, i) => i % 4 is 0
            goals    = tokens.filter (_, i) => i % 4 is 1
            metas    = tokens.filter (_, i) => i % 4 is 2
            sorts    = tokens.filter (_, i) => i % 4 is 3
            unmarked.map (u, i) ->
                unmarked: u
                goal: goals[i]
                meta: metas[i]
                sort: sorts[i]
