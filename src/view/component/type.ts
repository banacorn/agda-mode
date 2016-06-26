import Component from "vue-class-component";
import * as Vue from "vue";

@Component({
    props: {
        input: String
    },
    template: `<div class="type"><template v-for="item in type"><span v-if="item.unmarked" class="text-highlight">{{item.unmarked}}</span><button v-if="item.goal" class="no-btn text-info" @click="jumpToGoal(item.goal)">{{item.goal}}</button><span v-if="item.meta" class="text-success">{{item.meta}}</span><template v-if="item.sort"><span class="text-highlight">Set </span><span class="text-warning">{{item.sort}}</span></template></template></div>`
})
class Type extends Vue {

    // props
    input: string

    // methods
    jumpToGoal(index: number) {
        this.$dispatch("jump-to-goal", index);
    }

    get type() {
        //                               1       2                3
        const tokens = this.input.split(/(\?\d+)|(\_[^\.]\S*)|Set (\_\S+)/g);
        const unmarked = tokens.filter((_, i) => i % 4 === 0);
        const goals    = tokens.filter((_, i) => i % 4 === 1);
        const metas    = tokens.filter((_, i) => i % 4 === 2);
        const sorts    = tokens.filter((_, i) => i % 4 === 3);

        return unmarked.map((u, i) => {
            return {
                unmarked: u,
                goal: goals[i],
                meta: metas[i],
                sort: sorts[i],
            }
        })
    }
}

Vue.component("type", Type);
export default Type;
