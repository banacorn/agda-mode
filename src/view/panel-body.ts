import Component from "vue-class-component";
import * as Vue from "vue";
import * as _ from "lodash";
import { parseContent, parseError} from "../parser";
import { View } from "../types";

@Component({
    props: {
        "raw-content": Object
    },
    template: `
        <div class="native-key-bindings" tabindex="-1"  v-show="!queryMode">
            <ul id="panel-content-header" class="list-group">
                <li class="list-item" v-for="item in header">
                    <span class="text-info">{{item.label}}</span>
                    <span>:</span>
                    <type :input="item.type"></type>
                </li>
            </ul>
            <ul id="panel-content-body" class="list-group">
                <li class="list-item" v-for="item in body.goal">
                    <button class="no-btn text-info" @click="jumpToGoal(item.index)">{{item.index}}</button>
                    <span>:</span>
                    <type :input="item.type"></type>
                </li>
                <li class="list-item" v-for="item in body.judgement">
                    <span class="text-success">{{item.expr}}</span>
                    <span>:</span>
                    <type :input="item.type"></type>
                </li>
                <li class="list-item" v-for="item in body.term">
                    <type :input="item.expr"></type>
                </li>
                <li class="list-item" v-for="item in body.meta">
                    <span class="text-success">{{item.index}}</span>
                    <span>:</span>
                    <type :input="item.type"></type>
                    <location :location="item.location"></location>
                </li>
                <li class="list-item" v-for="item in body.sort">
                    <span class="text-highlight">Sort</span> <span class="text-warning">{{item.index}}</span>
                    <location :location="item.location"></location>
                </li>
                <li class="list-item" v-for="item in body.plainText">
                    <span>{{item}}</span>
                </li>
                <error v-if="body.error" :error="body.error"></error>
            </ul>
        </div>
        `
})
class PanelBody extends Vue {
    header: View.BannerItem[];
    body: View.Body | View.BodyError | View.BodyUnknown;

    data() {
        return {
            header: null,
            body: {
                goal: [],
                judgement: [],
                term: [],
                meta: [],
                sort: []
            }
        };
    }

    // methods
    jumpToGoal(index: number) {
        this.$dispatch("jump-to-goal", index);
    }
    // computed

    set rawContent(content: {
        header: string,
        body: string[],
        type: View.Type,
        placeholder: string
    }) {
        switch (content.type) {
            case View.Type.Value:
            case View.Type.Judgement:
                const { banner, body } = parseContent(content.body);

                this.header = banner;
                this.body = {
                    goal: _.filter(body, {judgementForm: "goal"}) as View.Goal[],
                    judgement: _.filter(body, {judgementForm: "type judgement"}) as View.Judgement[],
                    term: _.filter(body, {judgementForm: "term"}) as View.Term[],
                    meta: _.filter(body, {judgementForm: "meta"}) as View.Meta[],
                    sort: _.filter(body, {judgementForm: "sort"}) as View.Sort[]
                }
                break;
            case View.Type.Error:
                this.header = [];
                this.body = {
                    error: parseError(content.body)
                };
                break;
            default:
                this.header = [];
                this.body = {
                    plainText: content.body
                };
        }
    }

}

Vue.component("agda-panel-body", PanelBody);
export default PanelBody;
