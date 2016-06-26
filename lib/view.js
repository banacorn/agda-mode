"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var Vue = require("vue");
var vue_class_component_1 = require("vue-class-component");
require("./view/panel-body");
function toStyle(type) {
    switch (type) {
        case "error": return "error";
        case "warning": return "warning";
        case "type-judgement": return "info";
        case "value": return "success";
        case "plain-text": return "plain-text";
        default: return "";
    }
}
var View = (function () {
    function View() {
    }
    View.prototype.data = function () {
        return {
            content: {
                title: "",
                body: [],
                type: null,
                placeholder: ""
            },
            panelHeight: 30,
            panelSize: 5,
            inputMethodMode: false,
            queryMode: false,
            isPending: true,
            inputMethod: null,
            style: ""
        };
    };
    View.prototype.ready = function () {
        var _this = this;
        this.panelSize = atom.config.get("agda-mode.panelSize");
        this.panelHeight = 30;
        atom.config.observe("agda-mode.panelSize", function (newValue) {
            _this.panelSize = newValue;
        });
    };
    View.prototype.setContent = function (title, body, type, placeholder) {
        if (title === void 0) { title = ""; }
        if (body === void 0) { body = []; }
        if (type === void 0) { type = "plain-text"; }
        if (placeholder === void 0) { placeholder = ""; }
        this.content = {
            title: title,
            body: body,
            type: type,
            placeholder: placeholder
        };
        this.queryMode = false;
        this.style = toStyle(type);
    };
    View.prototype.query = function (enableIM) {
        var _this = this;
        if (enableIM === void 0) { enableIM = true; }
        var promise = this.$refs.inputEditor.query(enableIM);
        this.$once("input-editor:confirm", function () {
            _this.queryMode = false;
            atom.views.getView(atom.workspace.getActiveTextEditor()).focus();
        });
        this.$once("input-editor:cancel", function () {
            _this.queryMode = false;
            atom.views.getView(atom.workspace.getActiveTextEditor()).focus();
        });
        this.queryMode = true;
        return promise;
    };
    View = __decorate([
        vue_class_component_1.default({
            template: "\n        <div id=\"panel-header\" class=\"inset-panel padded\" v-show=\"content.title\">\n            <div id=\"panel-header-container\" v-show=\"!inputMethodMode\">\n                <div id=\"panel-title\" class=\"text-{{style}}\">\n                    {{content.title}}\n                </div>\n                <div id=\"panel-widget\">\n                </div>\n            </div>\n            <panel-input-method id=\"panel-input-method\" v-show=\"inputMethodMode\" :input=\"inputMethod\"></panel-input-method>\n        </div>\n        <div id=\"panel-panel-body\" class=\"padded\" v-show=\"content.body.length || queryMode\">\n            <agda-panel-body id=\"panel-content\" :style=\"{ maxHeight: panelHeight * panelSize + 'px' }\" :raw-content=\"content\"></agda-panel-body>\n            <panel-input-editor id=\"panel-input-editor\" v-ref:input-editor v-show=\"queryMode\"></panel-input-editor>\n        </div>\n        "
        }), 
        __metadata('design:paramtypes', [])
    ], View);
    return View;
}());
Vue.component("agda-view", View);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = View;
