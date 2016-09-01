"use strict";
var React = require('react');
var ReactDOM = require('react-dom');
var react_redux_1 = require('react-redux');
var redux_1 = require('redux');
var Panel_1 = require('./view/Panel');
var reducers_1 = require('./view/reducers');
var parser_1 = require('./parser');
var actions_1 = require('./view/actions');
var actions_2 = require('./view/actions');
var View = (function () {
    function View(core) {
        var _this = this;
        this.core = core;
        this.store = redux_1.createStore(reducers_1.default);
        // create an anchor element for the view to mount
        var anchor = document.createElement('agda-view');
        anchor.id = 'agda-panel';
        var atomPanel = atom.workspace.addBottomPanel({
            item: anchor,
            visible: true,
            className: 'agda-view'
        });
        this.panel = atom.workspace.addBottomPanel({
            item: document.createElement('agda-view'),
            visible: false,
            className: 'agda-view'
        });
        ReactDOM.render(React.createElement(react_redux_1.Provider, {store: this.store}, 
            React.createElement(Panel_1.default, {core: this.core, onMiniEditorMount: function (editor) {
                _this.miniEditor = editor;
            }, jumpToGoal: function (index) {
                _this.core.textBuffer.jumpToGoal(index);
            }})
        ), document.getElementById('agda-panel'));
    }
    View.prototype.activate = function () {
        this.store.dispatch(actions_1.activateView());
    };
    View.prototype.deactivate = function () {
        this.store.dispatch(actions_1.deactivateView());
    };
    View.prototype.destroy = function () {
        this.panel.destroy();
    };
    View.prototype.set = function (header, payload, type) {
        if (type === void 0) { type = 0 /* PlainText */; }
        this.store.dispatch(actions_2.updateHeader({
            text: header,
            style: type
        }));
        if (type === 3 /* Judgement */ || type === 4 /* Value */) {
            var _a = parser_1.parseContent(payload), banner = _a.banner, body = _a.body;
            var grouped = _.groupBy(body, 'judgementForm');
            this.store.dispatch(actions_2.updateBanner(banner));
            this.store.dispatch(actions_2.updateBody({
                goal: (grouped['goal'] || []),
                judgement: (grouped['type judgement'] || []),
                term: (grouped['term'] || []),
                meta: (grouped['meta'] || []),
                sort: (grouped['sort'] || [])
            }));
        }
        else if (type === 1 /* Error */) {
            var error = parser_1.parseError(payload.join('\n'));
            this.store.dispatch(actions_2.updateError(error));
        }
        else {
            this.store.dispatch(actions_2.updatePlainText(payload.join('\n')));
        }
    };
    View.prototype.query = function (header, message, type, placeholder) {
        this.store.dispatch(actions_2.activateMiniEditor(placeholder));
        this.store.dispatch(actions_2.updateHeader({
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