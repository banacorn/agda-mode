"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const React = require("react");
const Promise = require("bluebird");
const classNames = require("classnames");
const util_1 = require("../../parser/util");
const util_2 = require("./../../util");
const error_1 = require("./../../error");
const atom_1 = require("atom");
class MiniEditor extends React.Component {
    constructor(props) {
        super(props);
        this.subscriptions = new atom_1.CompositeDisposable;
        this.state = {
            focused: false
        };
        this.queryTP = new util_2.TelePromise;
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
        // pass the grammar down to enable input method
        if (this.props['data-grammar'] === 'agda') {
            const agdaGrammar = atom.grammars.grammarForScopeName('source.agda');
            try {
                this.ref.getModel().setGrammar(agdaGrammar);
            }
            catch (e) {
                // do nothing when we fail to load the grammar
            }
        }
        // subscribe to Atom's core events
        this.subscriptions.add(atom.commands.add(this.ref, 'core:confirm', () => {
            const payload = util_1.parseInputContent(this.ref.getModel().getText());
            if (this.props.onConfirm)
                this.props.onConfirm(payload);
            // resolve TelePromise for queries
            this.queryTP.resolve(payload);
        }));
        this.subscriptions.add(atom.commands.add(this.ref, 'core:cancel', () => {
            if (this.props.onCancel)
                this.props.onCancel();
            // reject TelePromise for queries
            this.queryTP.reject(new error_1.QueryCancelled);
        }));
        // observe 'focus'
        this.observeFocus();
        // placeholder
        if (this.props.placeholder)
            this.ref.getModel().setPlaceholderText(this.props.placeholder);
        // value
        if (this.props.value)
            this.ref.getModel().setText(this.props.value);
    }
    componentWillUnmount() {
        this.subscriptions.dispose();
        if (this.observer)
            this.observer.disconnect();
    }
    // focus on the input box (with setTimeout quirk)
    focus() {
        setTimeout(() => {
            this.ref.focus();
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
        return new Promise(this.queryTP.wire());
    }
    render() {
        if (this.ref && this.props.value)
            this.ref.getModel().setText(this.props.value.toString());
        const classes = classNames(this.props.className, 'mini-editor');
        return (React.createElement("atom-text-editor", { class: classes, mini: true, ref: (ref) => {
                if (ref)
                    this.ref = ref;
            } }));
    }
}
exports.default = MiniEditor;
//# sourceMappingURL=MiniEditor.js.map