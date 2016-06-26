import Component from "vue-class-component";
import * as Vue from "vue";
import * as _ from "lodash";

type CompositeDisposable = any;
var { CompositeDisposable } = require("atom");

declare var atom: any;

@Component({
    props: {
        input: {
            candidateSymbols: Array,
            suggestionKeys: Array,
            rawInput: Array,
        }
    },
    template: `
        <div>
            <div id="input-buffer-container">
                <div id="input-buffer" class="inline-block" v-show="rawInput">{{rawInput}}</div>
                <div id="suggestion-keys" class="btn-group btn-group-sm">
                    <button class="btn" v-for="key in suggestionKeys" @click="selectKey(key)">{{key}}</button>
                </div>
            </div>
            <div id="candidate-symbols" class="btn-group btn-group-sm">
                <button class="btn" v-for="symbol in selectedLeft" @click="selectSymbol(symbol)">{{symbol}}</button>
                <button class="btn selected" v-for="symbol in selected" @click="selectSymbol(symbol)">{{symbol}}</button>
                <button class="btn" v-for="symbol in selectedRight" @click="selectSymbol(symbol)">{{symbol}}</button>
            </div>
        </div>
        `
})
class InputMethod extends Vue {
    private subscriptions: CompositeDisposable;

    // data
    suggestionKeys: string[];
    candidateSymbols: string[];
    rawInput: string;
    index: number;

    data() {
        return {
            suggestionKeys: [],
            candidateSymbols: [],
            rawInput: "",
            index: 0
        }
    }
    // lifecycle hook
    ready() {
        const commands = {
            "core:move-up": (event) => {
                if (!_.isEmpty(this.candidateSymbols)) {
                    this.moveUp();
                    this.replaceSymbol(this.selected[0]);
                    event.stopImmediatePropagation();
                }
            },
            "core:move-right": (event) => {
                if (!_.isEmpty(this.candidateSymbols)) {
                    this.moveRight();
                    this.replaceSymbol(this.selected[0]);
                    event.stopImmediatePropagation();
                }
            },
            "core:move-down": (event) => {
                if (!_.isEmpty(this.candidateSymbols)) {
                    this.moveDown();
                    this.replaceSymbol(this.selected[0]);
                    event.stopImmediatePropagation();
                }
            },
            "core:move-left": (event) => {
                if (!_.isEmpty(this.candidateSymbols)) {
                    this.moveLeft();
                    this.replaceSymbol(this.selected[0]);
                    event.stopImmediatePropagation();
                }
            }
        }

        this.subscriptions = atom.commands.add("atom-text-editor.agda-mode-input-method-activated", commands);
    }

    destroy() {
        this.subscriptions.destroy();
    }
    // methods

    selectKey(key: string) {
        this.$dispatch("select-key", key);
    }
    selectSymbol(symbol: string) {
        this.$dispatch("select-symbol", symbol);
    }
    replaceSymbol(symbol: string) {
        this.$dispatch("replace-symbol", symbol);
    }
    moveUp() {
        if (this.index - 10 >= 0)
            this.index -= 10;
    }
    moveDown() {
        if ((this.index + 10) < this.candidateSymbols.length)
            this.index += 10;
    }
    moveLeft() {
        if (this.index - 1 >= 0)
            this.index -= 1;
    }
    moveRight() {
        if ((this.index + 1) < this.candidateSymbols.length)
            this.index += 1;
    }

    // computed
    set input(input: {
        candidateSymbols: string[],
        suggestionKeys: string[],
        rawInput: string,
    }) {
        this.candidateSymbols = input.candidateSymbols;
        this.suggestionKeys = input.suggestionKeys;
        this.rawInput = input.rawInput;
        this.index = 0;
    }

    get partialCandidateSymbols() {
        return _.take(_.drop(this.candidateSymbols, this.row * 10), 10);
    }
    get selectedLeft() {
        return _.take(this.partialCandidateSymbols, this.col)
    }
    get selected() {
        return _.compact(this.partialCandidateSymbols[this.col])
    }
    get selectedRight() {
        return _.drop(this.partialCandidateSymbols, this.col + 1)
    }
    get row() {
        return Math.floor(this.index / 10);
    }
    get col() {
        return this.index % 10;
    }
}

Vue.component("agda-input-method", InputMethod);
export default InputMethod;
