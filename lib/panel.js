'use strict';

let Loophole = require('loophole')
let Vue = require('vue')

let template = `
<div id="head" class="inset-panel padded">
    <template v-if="!inputMethodMode">
        <div v-text="title"></div>
    </template>
    <template v-if="inputMethodMode">
        <div>
            <div id="input-buffer" class="inline-block" v-text="inputMethod.rawInput"></div>
            <div id="suggestion-keys" class="btn-group btn-group-sm">
            </div>
        </div>
    </template>
</div>
<div id="body" class="block padded">
    <div class="agda-panel-content native-key-bindings" tabindex="-1">
        <ul class="list-group"></ul>
    </div>
</div>
`
 // v-text="inputMethod.rawInput"
class Panel extends Vue {
    constructor() {
        // Loophole.allowUnsafeNewFunction(function () {
            super({
                template: template,
                data: {
                    title: 'no-title',
                    inputMethodMode: false,
                    inputMethod: {
                        rawInput: '',
                        suggestionKeys: [],
                        candidateSymbols: []
                    }
                }
            });
        // });
    }
}

module.exports = Panel;
