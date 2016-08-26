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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var Vue = require("vue");
var vue_class_component_1 = require("vue-class-component");
require("./view/panel-body");
require("./view/input-method");
require("./view/input-editor");
require("./view/component/type");
require("./view/component/location");
require("./view/component/error");
Vue.config.debug = true;
function toHeaderStyle(type) {
    switch (type) {
        case 1: return "error";
        case 2: return "warning";
        case 3: return "info";
        case 4: return "success";
        case 0: return "plain-text";
        default: return "";
    }
}
var View = (function (_super) {
    __extends(View, _super);
    function View() {
        _super.apply(this, arguments);
    }
    View.prototype.data = function () {
        return {
            header: "",
            content: {
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
    View.prototype.ready = function () {
        var _this = this;
        this.panelSize = atom.config.get("agda-mode.panelSize");
        this.panelHeight = 30;
        atom.config.observe("agda-mode.panelSize", function (newValue) {
            _this.panelSize = newValue;
        });
    };
    View.prototype.set = function (header, body, type) {
        if (type === void 0) { type = 0; }
        this.header = header;
        this.content = {
            body: body,
            type: type,
            placeholder: ""
        };
        this.queryMode = false;
        this.headerStyle = toHeaderStyle(type);
    };
    View.prototype.query = function (header, message, type, placeholder, enableIM) {
        var _this = this;
        if (enableIM === void 0) { enableIM = true; }
        this.header = header;
        this.content = {
            body: message,
            type: type,
            placeholder: placeholder
        };
        this.headerStyle = toHeaderStyle(type);
        var promise = this.$refs.inputEditor.query(enableIM, placeholder);
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
            template: "\n        <div id=\"panel-header\" class=\"inset-panel padded\" v-show=\"header\">\n            <div id=\"panel-header-container\" v-show=\"!inputMethodMode\">\n                <div id=\"panel-title\" class=\"text-{{headerStyle}}\">\n                    {{header}}\n                </div>\n                <div id=\"panel-widget\">\n                </div>\n            </div>\n            <agda-input-method id=\"panel-input-method\" v-show=\"inputMethodMode\" :input=\"inputMethodInput\"></agda-input-method>\n        </div>\n        <div id=\"panel-body\" class=\"padded\" v-show=\"content.body.length || queryMode\">\n            <agda-panel-body id=\"panel-content\" :style=\"{ maxHeight: panelHeight * panelSize + 'px' }\" :raw-content=\"content\"></agda-panel-body>\n            <agda-input-editor id=\"panel-input-editor\" v-ref:input-editor v-show=\"queryMode\"></agda-input-editor>\n        </div>\n        "
        }), 
        __metadata('design:paramtypes', [])
    ], View);
    return View;
}(Vue));
Vue.component("agda-view", View);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = View;
//# sourceMappingURL=view.js.map