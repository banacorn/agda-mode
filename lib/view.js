"use strict";
var React = require('react');
var ReactDOM = require('react-dom');
var react_redux_1 = require('react-redux');
var redux_1 = require('redux');
var Panel_1 = require('./view/Panel');
var reducers_1 = require('./view/reducers');
var parser_1 = require('./parser');
var actions_1 = require('./view/actions');
var store = redux_1.createStore(reducers_1.default);
var View = (function () {
    function View(core) {
        this.core = core;
        this.store = store;
    }
    View.prototype.mount = function () {
        var _this = this;
        ReactDOM.render(React.createElement(react_redux_1.Provider, {store: store}, 
            React.createElement(Panel_1.default, {core: this.core, onMiniEditorMount: function (editor) {
                _this.miniEditor = editor;
            }})
        ), document.getElementById('agda-view'));
    };
    View.prototype.set = function (header, payload, type) {
        if (type === void 0) { type = 0 /* PlainText */; }
        this.store.dispatch(actions_1.updateHeader({
            text: header,
            style: type
        }));
        if (type === 3 /* Judgement */ || type === 4 /* Value */) {
            var _a = parser_1.parseContent(payload), banner = _a.banner, body = _a.body;
            var grouped = _.groupBy(body, 'judgementForm');
            this.store.dispatch(actions_1.updateBanner(banner));
            this.store.dispatch(actions_1.updateBody({
                goal: (grouped['goal'] || []),
                judgement: (grouped['type judgement'] || []),
                term: (grouped['term'] || []),
                meta: (grouped['meta'] || []),
                sort: (grouped['sort'] || [])
            }));
        }
        else if (type === 1 /* Error */) {
            var error = parser_1.parseError(payload.join('\n'));
            this.store.dispatch(actions_1.updateError(error));
        }
        else {
            this.store.dispatch(actions_1.updatePlainText(payload));
        }
    };
    View.prototype.query = function (header, message, type, placeholder) {
        this.store.dispatch(actions_1.activateMiniEditor(placeholder));
        this.store.dispatch(actions_1.updateHeader({
            text: header,
            style: type
        }));
        this.miniEditor.activate();
        return this.miniEditor.query();
    };
    return View;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = View;
//# sourceMappingURL=view.js.map