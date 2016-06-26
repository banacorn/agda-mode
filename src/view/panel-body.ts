import Component from "vue-class-component";
import * as Vue from "vue";
import * as _ from "lodash";
import { parseHeaderItem, parseItem, parseError} from "../parser";
import { View } from "../types";

// divide content into header and body
function divideContent(content: string[]): {
    header: string[],
    body: string[]
} {
    const notEmpty = content.length > 0;
    const index = content.indexOf("————————————————————————————————————————————————————————————");
    const isSectioned = index !== -1;

    if (notEmpty && isSectioned) {
        return {
            header: content.slice(0, index),
            body: content.slice(index + 1, content.length)
        }
    }
    else {
        return {
            header: [],
            body: content
        }
    }
}

// concatenate multiline judgements
function concatItems(lines: string[]): string[] {
    const lineStartRegex = /^(?:Goal|Have|\S+ )\:|Sort /;
    let result: string[] = [];
    let currentLine = 0;
    lines.forEach((item, i) => {
        if (item.match(lineStartRegex)) {
            currentLine = i;
            result[currentLine] = item;
        } else {
            if (result.length === 0) // predicate only, no subject
                result[currentLine] = item;
            else
                result[currentLine] = result[currentLine].concat("\n" + item);
        }
    });
    return _.compact(result);
}

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
                    <span v-if="item.index">:</span>
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
    header: View.Header[];
    body: View.Body | View.BodyError | View.BodyUnknown;

    // hack
    $refs: any;

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

    set rawContent(content) {
        switch (content.type) {
            case "value":
            case "type-judgement":
                const {header, body} = divideContent(content.body);
                this.header = concatItems(header).map(parseHeaderItem);
                const items = concatItems(body).map(parseItem);
                this.body = {
                    goal: _.filter(items, {judgementForm: "goal"}) as View.Goal[],
                    judgement: _.filter(items, {judgementForm: "type judgement"}) as View.Judgement[],
                    term: _.filter(items, {judgementForm: "term"}) as View.Term[],
                    meta: _.filter(items, {judgementForm: "meta"}) as View.Meta[],
                    sort: _.filter(items, {judgementForm: "sort"}) as View.Sort[]
                }
                break;
            case "error":
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
