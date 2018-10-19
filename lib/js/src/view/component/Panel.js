"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const React = require("react");
const react_redux_1 = require("react-redux");
const classNames = require("classnames");
const Action = require("../actions");
const InputMethod_1 = require("./Panel/InputMethod");
const SizingHandle_1 = require("./Panel/SizingHandle");
const view_1 = require("../../view");
const actions_1 = require("./../actions");
function toStyle(type) {
    switch (type) {
        case 3 /* Error */: return 'error';
        case 4 /* Warning */: return 'warning';
        case 1 /* Info */: return 'info';
        case 2 /* Success */: return 'success';
        case 0 /* PlainText */: return 'plain-text';
        default: return '';
    }
}
var Dashboard = require('./../../Reason/View/Panel/Dashboard.bs').jsComponent;
var JSONBody = require('./../../Reason/View/Panel/Body.bs').jsComponent;
var MiniEditor = require('./../../Reason/View/MiniEditor.bs').jsComponent;
var { toAtomRange, toAtomFilepath } = require('./../../Reason/View/Range.bs');
function mapStateToProps(state) {
    return Object.assign({ headerText: state.header.text, style: state.header.style, inputMethodActivated: state.inputMethod.activated, mountAt: state.view.mountAt, settingsView: state.view.settingsView, pending: state.protocol.pending }, state);
}
function mapDispatchToProps(dispatch) {
    return {
        onMaxBodyHeightChange: (count) => {
            dispatch(actions_1.updateMaxBodyHeight(count));
        },
        deactivateMiniEditor: () => {
            dispatch(actions_1.MODE.display());
        },
        onResize: (offset) => {
            dispatch(actions_1.updateMaxBodyHeight(offset));
        },
        handelQueryValueChange: (value) => {
            dispatch(actions_1.QUERY.updateValue(value));
        },
        //
        handleMountAtPane: () => {
            dispatch(Action.VIEW.mountAtPane());
        },
        handleMountAtBottom: () => {
            dispatch(Action.VIEW.mountAtBottom());
        },
        handleToggleSettingsView: () => {
            dispatch(Action.VIEW.toggleSettings());
        }
    };
}
class Panel extends React.Component {
    componentDidMount() {
        atom.config.observe('agda-mode.maxBodyHeight', (newHeight) => {
            this.props.onMaxBodyHeightChange(newHeight);
        });
    }
    render() {
        const { core, mode, body, onResize, mountAt, pending, settingsView, headerText, style, inputMethodActivated } = this.props;
        const atBottom = this.props.view.mountAt.current === 1 /* Bottom */;
        const hideEverything = classNames({ 'hidden': !this.props.view.activated && this.props.view.mountAt.current === 1 /* Bottom */ });
        return (React.createElement("section", { className: hideEverything },
            React.createElement("section", { className: 'panel-heading agda-header-container' },
                React.createElement(SizingHandle_1.default, { onResize: (height) => {
                        onResize(height);
                    }, onResizeEnd: () => {
                        atom.config.set('agda-mode.maxBodyHeight', this.props.body.maxBodyHeight);
                    }, atBottom: atBottom }),
                React.createElement(InputMethod_1.default, { updateTranslation: (c) => core.inputMethod.replaceBuffer(c), insertCharacter: (c) => {
                        core.inputMethod.insertCharToBuffer(c);
                        core.view.editors.focusMain();
                    }, chooseSymbol: (c) => {
                        core.inputMethod.replaceBuffer(c);
                        core.inputMethod.deactivate();
                        core.view.editors.focusMain();
                    } }),
                React.createElement(Dashboard, { header: headerText, style: toStyle(style), hidden: inputMethodActivated || _.isEmpty(headerText), isPending: pending, mountAt: mountAt.current === 1 /* Bottom */ ? 'bottom' : 'pane', onMountChange: (at) => {
                        core.view.toggleDocking();
                        if (at === "bottom") {
                            this.props.handleMountAtBottom();
                        }
                        else {
                            this.props.handleMountAtPane();
                        }
                    }, settingsViewOn: settingsView, onSettingsViewToggle: (isActivated) => {
                        this.props.handleToggleSettingsView();
                        if (isActivated) {
                            core.view.tabs.open('settings');
                        }
                        else {
                            core.view.tabs.close('settings');
                        }
                    } })),
            React.createElement("section", { className: 'agda-body-container' },
                React.createElement(view_1.default.EventContext.Consumer, null, emitter => (React.createElement(JSONBody, { raw: body.json, emacs: body.emacs, maxBodyHeight: body.maxBodyHeight, useJSON: core.connection.usesJSON(), hidden: 0 /* Display */ !== mode, mountAtBottom: mountAt.current === 1 /* Bottom */, emit: (ev, range) => {
                        switch (ev) {
                            case actions_1.EVENT.JUMP_TO_RANGE:
                                emitter.emit(actions_1.EVENT.JUMP_TO_RANGE, toAtomRange(range), toAtomFilepath(range));
                                break;
                            case actions_1.EVENT.MOUSE_OUT:
                                emitter.emit(actions_1.EVENT.MOUSE_OUT, toAtomRange(range), toAtomFilepath(range));
                                break;
                            case actions_1.EVENT.MOUSE_OVER:
                                emitter.emit(actions_1.EVENT.MOUSE_OVER, toAtomRange(range), toAtomFilepath(range));
                                break;
                        }
                    } }))),
                React.createElement(MiniEditor, { hidden: 1 /* Query */ !== mode, value: this.props.query.value, placeholder: this.props.query.placeholder, grammar: 'agda', editorRef: (editor) => {
                        core.view.editors.general.resolve(editor);
                    }, onFocus: () => {
                        core.view.editors.setFocus('general');
                    }, onBlur: () => {
                        core.view.editors.setFocus('main');
                    }, onConfirm: (result) => {
                        core.view.editors.answerGeneral(result);
                        this.props.handelQueryValueChange(result);
                        core.view.editors.focusMain();
                        this.props.deactivateMiniEditor();
                        core.inputMethod.confirm();
                    }, onCancel: () => {
                        core.view.editors.rejectGeneral();
                        core.view.editors.focusMain();
                        this.props.deactivateMiniEditor();
                        core.inputMethod.cancel();
                    } }))));
    }
}
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(Panel);
// <button className='btn icon icon-gear inline-block-tight'>Advenced Connection Settings</button>
//# sourceMappingURL=Panel.js.map