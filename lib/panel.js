'use strict';

let Vue = require('vue')
let _ = require('lodash')
let template = `
<div id="head" class="inset-panel padded" v-show="title">
    <div class="text-{{type}}" v-show="!inputMethodMode">{{title}}</div>
    <div id="input-method" v-show="inputMethodMode">
        <div id="input-buffer" class="inline-block">{{inputMethod.rawInput}}</div>
        <div id="suggestion-keys" class="btn-group btn-group-sm">
            <button class="btn" v-repeat="inputMethod.suggestionKeys">{{$value}}</button>
        </div>
    </div>
</div>
<div id="body" class="block padded" v-show="content.length || queryMode">
    <div class="agda-panel-content native-key-bindings" tabindex="-1">
        <ul class="list-group" v-show="!queryMode">
            <li class="list-item text-info" v-repeat="contentHeader">{{$value}}</li>
            <li class="list-item" v-repeat="contentBody">{{$value}}</li>
        </ul>
        <atom-text-editor placeholder="{{placeholder}}" v-show="queryMode">
    </div>
</div>
`
 // v-text="inputMethod.rawInput"
class Panel extends Vue {
    constructor() {
        super({
            template: template,
            data: {
                title: '',
                contentHeader: [],
                contentBody: [],
                type: '',
                placeholder: '',
                queryString: '',
                inputMethodMode: false,
                queryMode: false,
                inputMethod: {
                    rawInput: '',
                    suggestionKeys: [],
                    candidateSymbols: []
                }
            },
            methods: {
                setContent: function (title, content, type, placeholder) {
                    this.title          = title || '';
                    this.content        = content || [];
                    this.type           = type || '';
                    this.placeholder    = placeholder || '';
                }
            },
            computed: {
                content: {
                    set: function (raw) {
                        let content = raw.map(function(s){ return _.escape(s); });
                        if (content.length > 0) {
                            // divide content into 2 parts and style them differently
                            const index = content.indexOf('————————————————————————————————————————————————————————————')
                            const sectioned = index !== -1
                            if (sectioned) {
                                this.contentHeader = content.slice(0, index);
                                this.contentBody   = content.slice(index + 1, content.length);
                            } else {
                                this.contentHeader = [];
                                this.contentBody   = content;
                            }
                        } else {
                            this.contentHeader = [];
                            this.contentBody   = [];
                        }
                    },
                    get: function () {
                        return this.contentHeader.concat(this.contentBody);
                    }
                }
            }
        });
    }
}

module.exports = Panel;
