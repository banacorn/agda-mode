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
            keySuggestions: Array,
            rawInput: Array,
        }
    },
    template: `
        <div>
            <div id="input-buffer-container">
                <div id="input-buffer" class="inline-block" v-show="rawInput">{{rawInput}}</div>
                <div id="suggestion-keys" class="btn-group btn-group-sm">
                    <button class="btn" v-for="key in keySuggestions" @click="selectKey(key)">{{key}}</button>
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
    keySuggestions: string[];
    candidateSymbols: string[];
    rawInput: string;
    index: number;

    data() {
        return {
            keySuggestions: [],
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

    row(): number {
        return Math.floor(this.index / 10);
    }
    col(): number {
        return this.index % 10;
    }

    // computed
    set input(input: {
        candidateSymbols: string[],
        keySuggestions: string[],
        rawInput: string,
    }) {
        this.candidateSymbols = input.candidateSymbols;
        this.keySuggestions = input.keySuggestions;
        this.rawInput = input.rawInput;
        this.index = 0;
    }

    get selectedLeft() {
        const currentRow = _.take(_.drop(this.candidateSymbols, this.row() * 10), 10);
        return _.take(currentRow, this.col());
    }
    get selected() {
        const currentRow = _.take(_.drop(this.candidateSymbols, this.row() * 10), 10);
        return _.compact(currentRow[this.col()]);
    }
    get selectedRight() {
        const currentRow = _.take(_.drop(this.candidateSymbols, this.row() * 10), 10);
        return _.drop(currentRow, this.col() + 1);
    }
}

Vue.component("agda-input-method", InputMethod);
export default InputMethod;
