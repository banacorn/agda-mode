"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var vue_class_component_1 = require("vue-class-component");
var Vue = require("vue");
var _ = require("lodash");
var parser_1 = require("../parser");
// divide content into header and body
function divideContent(content) {
    var notEmpty = content.length > 0;
    var index = content.indexOf("————————————————————————————————————————————————————————————");
    var isSectioned = index !== -1;
    if (notEmpty && isSectioned) {
        return {
            header: content.slice(0, index),
            body: content.slice(index + 1, content.length)
        };
    }
    else {
        return {
            header: [],
            body: content
        };
    }
}
// concatenate multiline judgements
function concatItems(lines) {
    var newlineRegex = /^(?:Goal\:|Have\:|\S+\s+\:\s*|Sort) \S*/;
    var result = [];
    var currentLine = 0;
    lines.forEach(function (line, i) {
        var notTheLastLine = i + 1 < lines.length;
        var preemptLine = notTheLastLine ? line + "\n" + lines[i + 1] : line;
        if (line.match(newlineRegex) || preemptLine.match(newlineRegex)) {
            // is a new line
            currentLine = i;
            result[currentLine] = line;
        }
        else {
            // is not a new line, concat to the previous line
            result[currentLine] = result[currentLine].concat("\n" + line);
        }
    });
    return _.compact(result);
}
var PanelBody = (function (_super) {
    __extends(PanelBody, _super);
    function PanelBody() {
        _super.apply(this, arguments);
    }
    PanelBody.prototype.data = function () {
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
    };
    // methods
    PanelBody.prototype.jumpToGoal = function (index) {
        this.$dispatch("jump-to-goal", index);
    };
    Object.defineProperty(PanelBody.prototype, "rawContent", {
        // computed
        set: function (content) {
            switch (content.type) {
                case "value":
                case "type-judgement":
                    var _a = divideContent(content.body), header = _a.header, body = _a.body;
                    this.header = concatItems(header).map(parser_1.parseHeaderItem);
                    var items = concatItems(body).map(parser_1.parseItem);
                    this.body = {
                        goal: _.filter(items, { judgementForm: "goal" }),
                        judgement: _.filter(items, { judgementForm: "type judgement" }),
                        term: _.filter(items, { judgementForm: "term" }),
                        meta: _.filter(items, { judgementForm: "meta" }),
                        sort: _.filter(items, { judgementForm: "sort" })
                    };
                    break;
                case "error":
                    this.header = [];
                    this.body = {
                        error: parser_1.parseError(content.body)
                    };
                    break;
                default:
                    this.header = [];
                    this.body = {
                        plainText: content.body
                    };
            }
        },
        enumerable: true,
        configurable: true
    });
    PanelBody = __decorate([
        vue_class_component_1.default({
            props: {
                "raw-content": Object
            },
            template: "\n        <div class=\"native-key-bindings\" tabindex=\"-1\"  v-show=\"!queryMode\">\n            <ul id=\"panel-content-header\" class=\"list-group\">\n                <li class=\"list-item\" v-for=\"item in header\">\n                    <span class=\"text-info\">{{item.label}}</span>\n                    <span>:</span>\n                    <type :input=\"item.type\"></type>\n                </li>\n            </ul>\n            <ul id=\"panel-content-body\" class=\"list-group\">\n                <li class=\"list-item\" v-for=\"item in body.goal\">\n                    <button class=\"no-btn text-info\" @click=\"jumpToGoal(item.index)\">{{item.index}}</button>\n                    <span>:</span>\n                    <type :input=\"item.type\"></type>\n                </li>\n                <li class=\"list-item\" v-for=\"item in body.judgement\">\n                    <span class=\"text-success\">{{item.expr}}</span>\n                    <span>:</span>\n                    <type :input=\"item.type\"></type>\n                </li>\n                <li class=\"list-item\" v-for=\"item in body.term\">\n                    <type :input=\"item.expr\"></type>\n                </li>\n                <li class=\"list-item\" v-for=\"item in body.meta\">\n                    <span class=\"text-success\">{{item.index}}</span>\n                    <span>:</span>\n                    <type :input=\"item.type\"></type>\n                    <location :location=\"item.location\"></location>\n                </li>\n                <li class=\"list-item\" v-for=\"item in body.sort\">\n                    <span class=\"text-highlight\">Sort</span> <span class=\"text-warning\">{{item.index}}</span>\n                    <location :location=\"item.location\"></location>\n                </li>\n                <li class=\"list-item\" v-for=\"item in body.plainText\">\n                    <span>{{item}}</span>\n                </li>\n                <error v-if=\"body.error\" :error=\"body.error\"></error>\n            </ul>\n        </div>\n        "
        })
    ], PanelBody);
    return PanelBody;
}(Vue));
Vue.component("agda-panel-body", PanelBody);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PanelBody;
