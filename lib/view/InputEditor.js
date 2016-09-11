"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var React = require('react');
var Promise = require('bluebird');
var events_1 = require('events');
var parser_1 = require('../parser');
var error_1 = require('../error');
var CompositeDisposable = require('atom').CompositeDisposable;
var MEditor = (function (_super) {
    __extends(MEditor, _super);
    function MEditor() {
        _super.call(this);
        this.subscriptions = new CompositeDisposable;
        this.state = {
            focused: false
        };
        this.emitter = new events_1.EventEmitter;
    }
    MEditor.prototype.observeFocus = function () {
        var _this = this;
        this.observer = new MutationObserver(function (mutations) {
            mutations
                .filter(function (m) { return m.attributeName === 'class'; })
                .forEach(function () {
                var focusedBefore = _this.state.focused;
                var focusedNow = _.includes(_this.ref.classList, 'is-focused');
                if (focusedNow !== focusedBefore) {
                    _this.setState({
                        focused: focusedNow
                    });
                    if (focusedNow) {
                        if (_.isFunction(_this.props.onFocus))
                            _this.props.onFocus(null);
                    }
                    else {
                        if (_.isFunction(_this.props.onFocus))
                            _this.props.onBlur(null);
                    }
                }
            });
        });
        var config = { attributes: true };
        this.observer.observe(this.ref, config);
    };
    MEditor.prototype.componentDidMount = function () {
        var _this = this;
        var agdaGrammar = atom.grammars.grammarForScopeName('source.agda');
        this.ref.getModel().setGrammar(agdaGrammar);
        this.subscriptions.add(atom.commands.add(this.ref, 'core:confirm', function () {
            var payload = parser_1.parseInputContent(_this.ref.getModel().getText());
            _this.emitter.emit('confirm', payload);
            if (_this.props.onConfirm)
                _this.props.onConfirm(payload);
        }));
        this.subscriptions.add(atom.commands.add(this.ref, 'core:cancel', function () {
            _this.emitter.emit('cancel');
            if (_this.props.onCancel)
                _this.props.onCancel();
        }));
        this.observeFocus();
    };
    MEditor.prototype.componentWillUnmount = function () {
        this.subscriptions.destroy();
        this.observer.disconnect();
    };
    MEditor.prototype.focus = function () {
        var _this = this;
        setTimeout(function () {
            _this.ref.focus();
        });
    };
    MEditor.prototype.blur = function () {
        var _this = this;
        setTimeout(function () {
            _this.ref.blur();
        });
    };
    MEditor.prototype.select = function () {
        this.ref.getModel().selectAll();
    };
    MEditor.prototype.isFocused = function () {
        return this.state.focused;
    };
    MEditor.prototype.activate = function () {
        this.focus();
        this.select();
    };
    MEditor.prototype.query = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.emitter.once('confirm', function (payload) {
                resolve(payload);
            });
            _this.emitter.once('cancel', function () {
                reject(new error_1.QueryCancelledError(''));
            });
        });
    };
    MEditor.prototype.render = function () {
        var _this = this;
        return (React.createElement("atom-text-editor", {class: this.props.className, mini: true, ref: function (ref) { _this.ref = ref; }}));
    };
    return MEditor;
}(React.Component));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MiniEditor;
//# sourceMappingURL=InputEditor.js.map