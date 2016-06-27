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
var Vue = require("vue");
var vue_class_component_1 = require("vue-class-component");
// for component registration
require("./view/panel-body");
require("./view/input-method");
require("./view/input-editor");
require("./view/component/type");
require("./view/component/location");
require("./view/component/error");
Vue.config.debug = true;
function toHeaderStyle(type) {
    switch (type) {
        case 1 /* Error */: return "error";
        case 2 /* Warning */: return "warning";
        case 3 /* Judgement */: return "info";
        case 4 /* Value */: return "success";
        case 0 /* PlainText */: return "plain-text";
        default: return "";
    }
}
var View = (function (_super) {
    __extends(View, _super);
    function View() {
        _super.apply(this, arguments);
    }
    // constructor(private core: Core) {}
    View.prototype.data = function () {
        return {
            content: {
                header: "",
                body: [],
                type: null,
                placeholder: ""
            },
            panelHeight: 30,
            panelSize: 5,
            inputMethodMode: false,
            queryMode: false,
            isPending: true,
            inputMethodInput: null,
            headerStyle: ""
        };
    };
    //  initialize and bind configurations of panel size
    View.prototype.ready = function () {
        var _this = this;
        this.panelSize = atom.config.get("agda-mode.panelSize");
        this.panelHeight = 30;
        atom.config.observe("agda-mode.panelSize", function (newValue) {
            _this.panelSize = newValue;
        });
    };
    // methods
    View.prototype.set = function (header, body, type, placeholder) {
        if (header === void 0) { header = ""; }
        if (body === void 0) { body = []; }
        if (type === void 0) { type = 0 /* PlainText */; }
        if (placeholder === void 0) { placeholder = ""; }
        this.content = {
            header: header,
            body: body,
            type: type,
            placeholder: placeholder
        };
        this.queryMode = false;
        this.headerStyle = toHeaderStyle(type);
    };
    View.prototype.query = function (header, type, placeholder, enableIM) {
        var _this = this;
        if (enableIM === void 0) { enableIM = true; }
        this.content = {
            header: header,
            body: [],
            type: type,
            placeholder: placeholder
        };
        this.headerStyle = toHeaderStyle(type);
        // show input box, as it would had been hidden when initialized
        this.queryMode = true;
        var promise = this.$refs.inputEditor.query(enableIM);
        // hide input editor and give focus back
        this.$once("input-editor:confirm", function () {
            _this.queryMode = false;
            atom.views.getView(atom.workspace.getActiveTextEditor()).focus();
        });
        this.$once("input-editor:cancel", function () {
            _this.queryMode = false;
            atom.views.getView(atom.workspace.getActiveTextEditor()).focus();
        });
        return promise;
    };
    View = __decorate([
        vue_class_component_1.default({
            template: "\n        <div id=\"panel-header\" class=\"inset-panel padded\" v-show=\"content.header\">\n            <div id=\"panel-header-container\" v-show=\"!inputMethodMode\">\n                <div id=\"panel-title\" class=\"text-{{headerStyle}}\">\n                    {{content.header}}\n                </div>\n                <div id=\"panel-widget\">\n                </div>\n            </div>\n            <agda-input-method id=\"panel-input-method\" v-show=\"inputMethodMode\" :input=\"inputMethodInput\"></agda-input-method>\n        </div>\n        <div id=\"panel-body\" class=\"padded\" v-show=\"content.body.length || queryMode\">\n            <agda-panel-body id=\"panel-content\" :style=\"{ maxHeight: panelHeight * panelSize + 'px' }\" :raw-content=\"content\"></agda-panel-body>\n            <agda-input-editor id=\"panel-input-editor\" v-ref:input-editor v-show=\"queryMode\"></agda-input-editor>\n        </div>\n        "
        })
    ], View);
    return View;
}(Vue));
Vue.component("agda-view", View);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = View;
