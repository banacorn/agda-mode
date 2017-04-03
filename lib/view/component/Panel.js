"use strict";
const React = require("react");
const react_redux_1 = require("react-redux");
const classNames = require("classnames");
const InputMethod_1 = require("./InputMethod");
const Header_1 = require("./Header");
const Body_1 = require("./Body");
const SizingHandle_1 = require("./SizingHandle");
const MiniEditor_1 = require("./MiniEditor");
const actions_1 = require("./../actions");
const mapStateToProps = (state) => state;
const mapDispatchToProps = (dispatch) => ({
    deactivateMiniEditor: () => {
        dispatch(actions_1.deactivateMiniEditor());
    },
    onResize: (offset) => {
        dispatch(actions_1.updateMaxBodyHeight(offset));
    }
});
class Panel extends React.Component {
    render() {
        const { core, emitter, onMiniEditorMount, onResize } = this.props;
        const { mountAtPane, mountAtBottom, toggleDevView } = this.props;
        const atBottom = this.props.view.mountAt.current === 1 /* Bottom */;
        const hideEverything = classNames({ 'hidden': !this.props.view.activated && this.props.view.mountAt.current === 1 /* Bottom */ });
        const hideMiniEditor = classNames({ 'hidden': !this.props.miniEditor.activate });
        const hideBody = classNames({ 'hidden': this.props.miniEditor.activate });
        return (React.createElement("section", { className: hideEverything },
            React.createElement("header", { className: "panel-heading agda-header-container" },
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
                React.createElement(Header_1.default, { mountAtPane: mountAtPane, mountAtBottom: mountAtBottom, toggleDevView: toggleDevView })),
            React.createElement("section", { className: "agda-body-container" },
                React.createElement(MiniEditor_1.default, { className: hideMiniEditor, placeholder: this.props.miniEditor.placeholder, ref: (ref) => {
                        if (ref)
                            onMiniEditorMount(ref);
                    }, onConfirm: () => {
                        atom.views.getView(core.view.getEditor()).focus();
                        this.props.deactivateMiniEditor();
                    }, onCancel: () => {
                        atom.views.getView(core.view.getEditor()).focus();
                        this.props.deactivateMiniEditor();
                    } }),
                React.createElement(Body_1.default, { emitter: emitter, className: hideBody }))));
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(Panel);
//# sourceMappingURL=Panel.js.map