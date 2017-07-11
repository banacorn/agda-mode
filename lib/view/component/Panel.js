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
const connector_1 = require("./../../connector");
const error_1 = require("./../../error");
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
                        atom.views.getView(core.view.getEditor()).focus();
                    }, chooseSymbol: (c) => {
                        core.inputMethod.replaceBuffer(c);
                        core.inputMethod.deactivate();
                        atom.views.getView(core.view.getEditor()).focus();
                    } }),
                React.createElement(Header_1.default, { core: core })),
            React.createElement("section", { className: "agda-body-container" },
                React.createElement(Body_1.default, { className: show(0 /* Display */, mode), emitter: emitter }),
                React.createElement(MiniEditor_1.default, { className: show(1 /* Query */, mode), value: this.props.query.value, placeholder: this.props.query.placeholder, "data-grammar": "source agda", ref: (ref) => {
                        if (ref)
                            core.view.miniEditor = ref;
                    }, onConfirm: (result) => {
                        this.props.handelQueryValueChange(result);
                        core.view.queryTP.resolve(result);
                        atom.views.getView(core.view.getEditor()).focus();
                        this.props.deactivateMiniEditor();
                    }, onCancel: () => {
                        core.view.queryTP.reject(new error_1.QueryCancelled);
                        atom.views.getView(core.view.getEditor()).focus();
                        this.props.deactivateMiniEditor();
                    } }),
                React.createElement("div", { className: show(2 /* InquireConnection */, mode) },
                    React.createElement("p", null, "Unable to find Agda on your machine, please enter the path of Agda manually."),
                    React.createElement(MiniEditor_1.default, { onConfirm: (path) => {
                            core.view.connectionInquisitorTP.resolve(path);
                            atom.views.getView(core.view.getEditor()).focus();
                            this.props.deactivateMiniEditor();
                        }, onCancel: () => {
                            core.view.connectionInquisitorTP.reject(new connector_1.NoConnectionGiven);
                            atom.views.getView(core.view.getEditor()).focus();
                            this.props.deactivateMiniEditor();
                        } })))));
    }
}
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(Panel);
//# sourceMappingURL=Panel.js.map