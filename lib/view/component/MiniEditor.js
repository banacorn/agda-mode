"use strict";
const _ = require("lodash");
const React = require("react");
const Promise = require("bluebird");
const events_1 = require("events");
const classNames = require("classnames");
const parser_1 = require("../../parser");
const error_1 = require("../../error");
var { CompositeDisposable } = require('atom');
class MiniEditor extends React.Component {
    constructor() {
        super();
        this.subscriptions = new CompositeDisposable;
        this.state = {
            focused: false
        };
        this.emitter = new events_1.EventEmitter;
    }
    observeFocus() {
        // create an observer instance
        this.observer = new MutationObserver((mutations) => {
            mutations
                .filter((m) => m.attributeName === 'class')
                .forEach(() => {
                const focusedBefore = this.state.focused;
                const focusedNow = _.includes(this.ref.classList, 'is-focused');
                if (focusedNow !== focusedBefore) {
                    // update state: focused
                    this.setState({
                        focused: focusedNow
                    });
                    // trigger events
                    if (focusedNow) {
                        if (_.isFunction(this.props.onFocus))
                            this.props.onFocus(null);
                    }
                    else {
                        if (_.isFunction(this.props.onFocus))
                            this.props.onBlur(null);
                    }
                }
            });
        });
        // configuration of the observer:
        var config = { attributes: true };
        // pass in the target node, as well as the observer options
        this.observer.observe(this.ref, config);
    }
    componentDidMount() {
        // set grammar: agda to enable input method
        const agdaGrammar = atom.grammars.grammarForScopeName('source.agda');
        this.ref.getModel().setGrammar(agdaGrammar);
        // subscribe to Atom's core events
        this.subscriptions.add(atom.commands.add(this.ref, 'core:confirm', () => {
            const payload = parser_1.parseInputContent(this.ref.getModel().getText());
            this.emitter.emit('confirm', payload);
            if (this.props.onConfirm)
                this.props.onConfirm(payload);
        }));
        this.subscriptions.add(atom.commands.add(this.ref, 'core:cancel', () => {
            this.emitter.emit('cancel');
            if (this.props.onCancel)
                this.props.onCancel();
        }));
        // observe 'focus'
        this.observeFocus();
        // placeholder
        if (this.props.placeholder)
            this.ref.getModel().setPlaceholderText(this.props.placeholder);
    }
    componentWillUnmount() {
        this.subscriptions.dispose();
        this.observer.disconnect();
    }
    // focus on the input box (with setTimeout quirk)
    focus() {
        setTimeout(() => {
            this.ref.focus();
        });
    }
    blur() {
        setTimeout(() => {
            this.ref.blur();
        });
    }
    select() {
        this.ref.getModel().selectAll();
    }
    isFocused() {
        return this.state.focused;
    }
    getModel() {
        return this.ref.getModel();
    }
    activate() {
        this.focus();
        this.select();
    }
    query() {
        return new Promise((resolve, reject) => {
            this.emitter.once('confirm', (payload) => {
                this.emitter.removeAllListeners();
                resolve(payload);
            });
            this.emitter.once('cancel', () => {
                this.emitter.removeAllListeners();
                reject(new error_1.QueryCancelledError(''));
            });
        });
    }
    render() {
        const classes = classNames(this.props.className, 'agda-mini-editor');
        return (React.createElement("atom-text-editor", { class: classes, mini: true, ref: (ref) => {
                if (ref)
                    this.ref = ref;
            } }));
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MiniEditor;
//# sourceMappingURL=MiniEditor.js.map