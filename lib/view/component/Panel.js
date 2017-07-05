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
        }
    };
}
class Panel extends React.Component {
    render() {
        const { core, emitter, onResize } = this.props;
        const atBottom = this.props.view.mountAt.current === 1 /* Bottom */;
        const hideEverything = classNames({ 'hidden': !this.props.view.activated && this.props.view.mountAt.current === 1 /* Bottom */ });
        let body;
        switch (this.props.mode) {
            case 0 /* Display */:
                body =
                    React.createElement(Body_1.default, { emitter: emitter });
                break;
            case 1 /* Query */:
                body =
                    React.createElement(MiniEditor_1.default, { ref: (ref) => {
                            if (ref)
                                core.view.miniEditor = ref;
                        }, onConfirm: () => {
                            atom.views.getView(core.view.getEditor()).focus();
                            this.props.deactivateMiniEditor();
                        }, onCancel: () => {
                            atom.views.getView(core.view.getEditor()).focus();
                            this.props.deactivateMiniEditor();
                        } });
                break;
        }
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
            React.createElement("section", { className: "agda-body-container" }, body)));
    }
}
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(Panel);
//# sourceMappingURL=Panel.js.map