"use strict";
var _this = this;
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
var View = Vue.extend({
    template: "\n        <div id=\"panel-header\" class=\"inset-panel padded\" v-show=\"content.title\">\n            <div id=\"panel-header-container\" v-show=\"!inputMethodMode\">\n                <div id=\"panel-title\" class=\"text-{{style}}\">\n                    {{content.title}}\n                </div>\n                <div id=\"panel-widget\">\n                </div>\n            </div>\n            <panel-input-method id=\"panel-input-method\" v-show=\"inputMethodMode\" :input=\"inputMethod\"></panel-input-method>\n        </div>\n        <div id=\"panel-body\" class=\"padded\" v-show=\"content.body.length || queryMode\">\n            <panel-body id=\"panel-content\" :style=\"{ maxHeight: panelHeight * panelSize + 'px' }\" :raw-content=\"content\"></panel-body>\n            <panel-input-editor id=\"panel-input-editor\" v-ref:input-editor v-show=\"queryMode\"></panel-input-editor>\n        </div>\n        ",
    data: function () {
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
    },
    methods: {
        setContent: function (title, body, type, placeholder) {
            if (title === void 0) { title = ""; }
            if (body === void 0) { body = []; }
            if (type === void 0) { type = "plain-text"; }
            if (placeholder === void 0) { placeholder = ""; }
            _this.content = {
                title: title,
                body: body,
                type: type,
                placeholder: placeholder
            };
            _this.queryMode = false;
            _this.style = toStyle(type);
        },
        query: function (enableIM) {
            if (enableIM === void 0) { enableIM = true; }
            var promise = _this.$refs.inputEditor.query(enableIM);
            _this.$once("input-editor:confirm", function () {
                _this.queryMode = false;
                atom.views.getView(atom.workspace.getActiveTextEditor()).focus();
            });
            _this.$once("input-editor:cancel", function () {
                _this.queryMode = false;
                atom.views.getView(atom.workspace.getActiveTextEditor()).focus();
            });
            _this.queryMode = true;
            return promise;
        }
    },
    ready: function () {
        _this.panelSize = atom.config.get("agda-mode.panelSize");
        _this.panelHeight = 30;
        atom.config.observe("agda-mode.panelSize", function (newValue) {
            _this.panelSize = newValue;
        });
    }
});
Vue.component("agda-panel", View);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = View;
