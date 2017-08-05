"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_redux_1 = require("react-redux");
const classNames = require("classnames");
const InputMethod_1 = require("./InputMethod");
const Header_1 = require("./Header");
const Body_1 = require("./Body");
const SizingHandle_1 = require("./SizingHandle");
const MiniEditor_1 = require("./MiniEditor");
const actions_1 = require("./../actions");
function mapStateToProps(state) {
    return state;
}
function mapDispatchToProps(dispatch) {
    return {
        deactivateMiniEditor: () => {
            dispatch(actions_1.MODE.display());
        },
        onResize: (offset) => {
            dispatch(actions_1.updateMaxBodyHeight(offset));
        },
        handelQueryValueChange: (value) => {
            dispatch(actions_1.QUERY.updateValue(value));
        }
    };
}
function show(kind, mode, ...classes) {
    return classNames(Object.assign({ 'hidden': kind !== mode }, classes));
}
class Panel extends React.Component {
    render() {
        const { core, emitter, mode, onResize, handelQueryValueChange } = this.props;
        const atBottom = this.props.view.mountAt.current === 1 /* Bottom */;
        const hideEverything = classNames({ 'hidden': !this.props.view.activated && this.props.view.mountAt.current === 1 /* Bottom */ });
        return (React.createElement("section", { className: hideEverything },
            React.createElement("section", { className: "panel-heading agda-header-container" },
                React.createElement(SizingHandle_1.default, { onResize: (height) => {
                        onResize(height);
                    }, onResizeEnd: () => {
                        atom.config.set('agda-mode.maxBodyHeight', this.props.body.maxBodyHeight);
                    }, atBottom: atBottom }),
                React.createElement(InputMethod_1.default, { updateTranslation: (c) => core.inputMethod.replaceBuffer(c), insertCharacter: (c) => {
                        core.inputMethod.insertCharToBuffer(c);
                        core.view.editors.focus('main');
                    }, chooseSymbol: (c) => {
                        core.inputMethod.replaceBuffer(c);
                        core.inputMethod.deactivate();
                        core.view.editors.focus('main');
                    } }),
                React.createElement(Header_1.default, { core: core })),
            React.createElement("section", { className: "agda-body-container" },
                React.createElement(Body_1.default, { className: show(0 /* Display */, mode), emitter: emitter }),
                React.createElement(MiniEditor_1.default, { className: show(1 /* Query */, mode), value: this.props.query.value, placeholder: this.props.query.placeholder, "data-grammar": "source agda", ref: (ref) => {
                        if (ref)
                            core.view.editors.general = ref;
                    }, onConfirm: (result) => {
                        this.props.handelQueryValueChange(result);
                        core.view.editors.focus('main');
                        this.props.deactivateMiniEditor();
                    }, onCancel: () => {
                        core.view.editors.focus('main');
                        this.props.deactivateMiniEditor();
                    } }),
                React.createElement("div", { className: show(2 /* QueryConnection */, mode) },
                    React.createElement("p", null, "Unable to find Agda on your machine, please enter the path of Agda manually."),
                    React.createElement(MiniEditor_1.default, { ref: (ref) => {
                            if (ref)
                                core.view.editors.connection = ref;
                        }, onConfirm: (path) => {
                            core.view.editors.focus('main');
                            this.props.deactivateMiniEditor();
                        }, onCancel: () => {
                            core.view.editors.focus('main');
                            this.props.deactivateMiniEditor();
                        } })))));
    }
}
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(Panel);
// <button className='btn icon icon-gear inline-block-tight'>Advenced Connection Settings</button>
//# sourceMappingURL=Panel.js.map