"use babel";
'use strict';


let Vue = require('vue')
let Promise = require('bluebird')
let _ = require('lodash')
let {QueryCancelledError} = require('./error')
let {TextEditorView} = require('atom-space-pen-views')
import {CompositeDisposable} from 'atom'

let template = `
<div id="head" class="inset-panel padded" v-show="title">
    <div class="text-{{type}}" v-show="!inputMethodMode">{{title}}</div>
    <div id="input-method" v-show="inputMethodMode">
        <div id="input-buffer" class="inline-block">{{inputMethod.rawInput}}</div>
        <div id="suggestion-keys" class="btn-group btn-group-sm">
            <button class="btn" v-repeat="inputMethod.suggestionKeys" v-on="click: selectKey($value)">{{$value}}</button>
        </div>
    </div>
</div>
<div id="body" class="padded" v-show="content.length || queryMode">
    <div class="agda-panel-content native-key-bindings" tabindex="-1"  v-show="!queryMode">
        <ul class="list-group">
            <li class="list-item text-info" v-repeat="contentHeader">{{$value}}</li>
            <li class="list-item" v-repeat="contentBody">{{$value}}</li>
            <li class="list-item" v-repeat="contentGoal"><button class='no-btn text-info' v-on="click: jumpToGoal(index)">{{index}}</button> {{type}}</li>
        </ul>
    </div>
    <div id="input-editor" v-show="queryMode">
    </div>
</div>
`
            // <li class="list-item" v-repeat="contentGoal"><span class='badge'>{{index}}</span>   {{type}}</li>

class Panel extends Vue {

    subscriptions = new CompositeDisposable

    constructor(core) {
        let editor = new TextEditorView({mini: true});
        super({
            template: template,
            data: {
                title: '',

                contentHeader: [],
                contentBody: [],
                contentGoal: [],

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
                setContent (title = '', content = [], type = '', placeholder = '') {
                    this.queryMode      = false;
                    this.title          = title;
                    this.content        = content;
                    this.type           = type;
                    this.placeholder    = placeholder;
                },

                query() {
                    // show the input box
                    this.queryMode = true;
                    // reject old promise if it already exists
                    this.rejectQuery();
                    // focus the input box (with setTimeout quirk)
                    setTimeout(() => this.inputEditor.focus());
                    return new Promise((resolve, reject) => {
                        this.queryPromise = {
                            resolve: resolve,
                            reject: reject
                        };
                    });
                },
                rejectQuery() {
                    if (this.queryPromise) {
                        this.queryPromise.reject(new QueryCancelledError);
                        delete this.queryPromise;
                    }
                },
                resolveQuery(message) {
                    if (this.queryPromise) {
                        this.queryPromise.resolve(message);
                        delete this.queryPromise;
                    }
                },
                selectKey(key) {
                    core.inputMethod.insertChar(key);
                },
                jumpToGoal(index) {
                    core.textBuffer.jumpToGoal(parseInt(index));
                }
            },
            computed: {
                content: {
                    set(raw) {
                        let content = raw.map(function(s){ return s; });

                        this.contentHeader = [];
                        this.contentBody   = [];
                        this.contentGoal   = [];

                        // divide content into 2 parts and style them differently
                        if (content.length > 0) {
                            const index = content.indexOf('————————————————————————————————————————————————————————————')
                            const sectioned = index !== -1
                            if (sectioned) {
                                this.contentHeader = content.slice(0, index);
                                this.contentBody   = content.slice(index + 1, content.length);
                            } else {
                                this.contentBody   = content;
                            }
                        }

                        // style goal list differently
                        if (this.title === 'Goals') {
                            this.contentGoal = this.contentBody.map((item) => {
                                let result = item.match(/^\?(\d*) \: (.*)/);
                                return {
                                    index: result[1],
                                    type: result[2]
                                }
                            });
                            this.contentBody = [];
                        }
                    },
                    get() {
                        return this.contentHeader.concat(this.contentBody).concat(this.contentGoal);
                    }
                },

            },
            attached() {
                this.$el.parentElement.querySelector('#input-editor').appendChild(editor.element);
                this.inputEditor = editor;

                // input editor event subscriptions
                this.subscriptions.add(atom.commands.add(this.inputEditor.element, 'core:confirm', () => {
                    this.queryMode = false;
                    this.resolveQuery(this.inputEditor.getText().trim());
                    // give focus back
                    atom.views.getView(atom.workspace.getActiveTextEditor()).focus();
                }));
                this.subscriptions.add(atom.commands.add(this.inputEditor.element, 'core:cancel', () => {
                    this.queryMode = false;
                    this.rejectQuery();
                    // give focus back
                    atom.views.getView(atom.workspace.getActiveTextEditor()).focus();
                }));
            }
        });
    }

    destroy() {
        this.subscriptions.destroy();
    }
}

module.exports = Panel;
