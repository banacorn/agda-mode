import Component from "vue-class-component";
import * as Vue from "vue";
import { View, Location as Loc } from "../../types";

@Component({
    props: {
        location: Object
    },
    template: `<span class="{{classes}} text-subtle" @click="jump(location)"><template v-if="location.path">{{location.path}}:</template><template v-if="isSameLine">{{location.range.start.row + 1}},{{location.range.start.column + 1}}-{{location.range.end.column + 1}}</template><template v-if="notSameLine">{{location.range.start.row + 1}},{{location.range.start.column + 1}}-{{location.range.end.row + 1}},{{location.range.end.column + 1}}</template></span>`
})
class Location extends Vue {

    // props
    location: Loc;

    // methods
    jump(index: number) {
        this.$dispatch("jump-to-location", index);
    }

    get classes(): string {
        const attr = this.$el.attributes.getNamedItem('no-float');
        if (attr)
            return "location no-float";
        else
            return "location";
    }

    get isSameLine(): boolean {
        return this.location.isSameLine;
    }

    get notSameLine(): boolean {
        return !this.location.isSameLine;
    }
}

Vue.component("location", Location);
export default Location;
