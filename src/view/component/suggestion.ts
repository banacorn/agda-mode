import * as _ from "lodash";;
import Component from "vue-class-component";
import * as Vue from "vue";
import { View, Suggestion as SuggestionType } from "../../types";

// did you mean: ℕ.succ         -- head
//            or succ           -- middle
//            or suc ?          -- last

@Component({
    props: {
        input: Array
    },
    template: `
<template v-if="notEmpty">
    <template v-if="singleLine">
        <li class="list-item">Did you mean: {{input[0]}} ?</li>
    </template>
    <template v-else>
        <li class="list-item" v-for="item in head"><span>Did you mean: </span><type :input="item"></type></li>
        <li class="list-item" v-for="item in middle"><span>           or </span><type :input="item"></type></li>
        <li class="list-item" v-for="item in last"><span>           or </span><type :input="item"></type><span> ?</span></li>
    </template>
</template>
`
})
class Suggestion extends Vue {
    // props
    input: SuggestionType;

    // computed
    get notEmpty(): boolean {
        return this.input.length !== 0;
    }

    get singleLine(): boolean {
        return this.input.length === 1;
    }

    get head(): string[] {
        return [_.head(this.input)];
    }

    get middle(): string[] {
        return _.initial(_.tail(this.input));
    }

    get last(): string[] {
        return [_.last(this.input)];
    }
}

Vue.component("suggestion", Suggestion);
export default Suggestion;
