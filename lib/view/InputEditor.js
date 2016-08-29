"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var React = require('react');
var react_redux_1 = require('react-redux');
var classNames = require('classnames');
var _ = require('lodash');
var parser_1 = require('../parser');
var CompositeDisposable = require('atom').CompositeDisposable;
var mapStateToProps = function (state) {
    return state.inputEditor;
};
var InputEditor = (function (_super) {
    __extends(InputEditor, _super);
    function InputEditor() {
        _super.call(this);
        this.subscriptions = new CompositeDisposable;
    }
    InputEditor.prototype.observeClassList = function (callback) {
        this.observer = new MutationObserver(function (mutations) {
            mutations
                .filter(function (m) { return m.attributeName === 'class'; })
                .forEach(callback);
        });
        var config = { attributes: true };
        this.observer.observe(this.ref, config);
    };
    InputEditor.prototype.componentDidMount = function () {
        var _this = this;
        var emitter = this.props.emitter;
        this.subscriptions.add(atom.commands.add(this.ref, 'core:confirm', function () {
            var payload = parser_1.parseInputContent(_this.ref.getModel().getText());
            emitter.emit('confirm', payload);
        }));
        this.subscriptions.add(atom.commands.add(this.ref, 'core:cancel', function () {
            emitter.emit('cancel');
        }));
        this.observeClassList(function () {
            console.log(_.includes(_this.ref.classList, 'is-focused'));
        });
    };
    InputEditor.prototype.componentWillUnmount = function () {
        this.subscriptions.destroy();
        this.observer.disconnect();
    };
    InputEditor.prototype.focus = function () {
        var _this = this;
        setTimeout(function () { _this.ref.focus(); });
    };
    InputEditor.prototype.select = function () {
        this.ref.getModel().selectAll();
    };
    InputEditor.prototype.render = function () {
        var _this = this;
        var _a = this.props, placeholder = _a.placeholder, activated = _a.activated;
        var hidden = classNames({ 'hidden': !activated });
        if (activated) {
            this.ref.getModel().setPlaceholderText(placeholder);
            this.focus();
            this.select();
        }
        return (React.createElement("atom-text-editor", {class: hidden, mini: true, "placeholder-text": placeholder, ref: function (ref) { _this.ref = ref; }}));
    };
    return InputEditor;
}(React.Component));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = react_redux_1.connect(mapStateToProps, null)(InputEditor);
//# sourceMappingURL=InputEditor.js.map