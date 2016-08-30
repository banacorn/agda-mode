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
var InputEditor = (function (_super) {
    __extends(InputEditor, _super);
    function InputEditor() {
        _super.call(this);
        this.subscriptions = new CompositeDisposable;
        this.state = {
            focused: false
        };
        this.emitter = new events_1.EventEmitter;
    }
    InputEditor.prototype.observeFocus = function () {
        var _this = this;
        // create an observer instance
        this.observer = new MutationObserver(function (mutations) {
            mutations
                .filter(function (m) { return m.attributeName === 'class'; })
                .forEach(function () {
                var focusedBefore = _this.state.focused;
                var focusedNow = _.includes(_this.ref.classList, 'is-focused');
                if (focusedNow !== focusedBefore) {
                    // update state: focused
                    _this.setState({
                        focused: focusedNow
                    });
                    // trigger events
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
        // configuration of the observer:
        var config = { attributes: true };
        // pass in the target node, as well as the observer options
        this.observer.observe(this.ref, config);
    };
    InputEditor.prototype.componentDidMount = function () {
        var _this = this;
        // set grammar: agda to enable input method
        var agdaGrammar = atom.grammars.grammarForScopeName('source.agda');
        this.ref.getModel().setGrammar(agdaGrammar);
        // subscribe to Atom's core events
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
        // observe 'focus'
        this.observeFocus();
    };
    InputEditor.prototype.componentWillUnmount = function () {
        this.subscriptions.destroy();
        this.observer.disconnect();
    };
    // focus on the input box (with setTimeout quirk)
    InputEditor.prototype.focus = function () {
        var _this = this;
        setTimeout(function () {
            _this.ref.focus();
        });
    };
    InputEditor.prototype.blur = function () {
        var _this = this;
        setTimeout(function () {
            _this.ref.blur();
        });
    };
    InputEditor.prototype.select = function () {
        this.ref.getModel().selectAll();
    };
    InputEditor.prototype.isFocused = function () {
        return this.state.focused;
    };
    InputEditor.prototype.activate = function () {
        this.focus();
        // if (this.props.placeholder)
        //     this.ref.getModel().setPlaceholderText(this.props.placeholder);
        this.select();
    };
    InputEditor.prototype.query = function () {
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
    InputEditor.prototype.render = function () {
        var _this = this;
        console.log(this.state);
        return (React.createElement("atom-text-editor", {class: this.props.className, mini: true, ref: function (ref) { _this.ref = ref; }}));
    };
    return InputEditor;
}(React.Component));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = InputEditor;
//# sourceMappingURL=InputEditor.js.map