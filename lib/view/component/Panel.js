"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var React = require('react');
var react_redux_1 = require('react-redux');
var classNames = require('classnames');
var InputMethod_1 = require('./InputMethod');
var Header_1 = require('./Header');
var Body_1 = require('./Body');
var MiniEditor_1 = require('./MiniEditor');
var actions_1 = require('./../actions');
var mapStateToProps = function (state) { return state; };
var mapDispatchToProps = function (dispatch) { return ({
    deactivateMiniEditor: function () {
        dispatch(actions_1.deactivateMiniEditor());
    }
}); };
var Panel = (function (_super) {
    __extends(Panel, _super);
    function Panel() {
        _super.apply(this, arguments);
    }
    Panel.prototype.render = function () {
        var _this = this;
        var _a = this.props, core = _a.core, onMiniEditorMount = _a.onMiniEditorMount, jumpToGoal = _a.jumpToGoal, jumpToLocation = _a.jumpToLocation;
        var hideEverything = classNames({ 'hidden': !this.props.activated });
        var hideMiniEditor = classNames({ 'hidden': !this.props.miniEditor.activate });
        var hideBody = classNames({ 'hidden': this.props.miniEditor.activate });
        return (React.createElement("section", {className: hideEverything}, 
            React.createElement("header", {id: "agda-header", className: "panel-heading"}, 
                React.createElement(InputMethod_1.default, {updateTranslation: function (c) { return core.inputMethod.replaceBuffer(c); }, insertCharacter: function (c) {
                    core.inputMethod.insertCharToBufffer(c);
                    atom.views.getView(atom.workspace.getActiveTextEditor()).focus();
                }, chooseSymbol: function (c) {
                    core.inputMethod.replaceBuffer(c);
                    core.inputMethod.deactivate();
                    atom.views.getView(atom.workspace.getActiveTextEditor()).focus();
                }}), 
                React.createElement(Header_1.default, null)), 
            React.createElement("section", {className: "panel-body"}, 
                React.createElement(MiniEditor_1.default, {className: hideMiniEditor, placeholder: this.props.miniEditor.placeholder, ref: function (ref) {
                    if (ref)
                        onMiniEditorMount(ref);
                }, onConfirm: function () {
                    atom.views.getView(atom.workspace.getActiveTextEditor()).focus();
                    _this.props.deactivateMiniEditor();
                }, onCancel: function () {
                    atom.views.getView(atom.workspace.getActiveTextEditor()).focus();
                    _this.props.deactivateMiniEditor();
                }}), 
                React.createElement(Body_1.default, {className: hideBody, jumpToGoal: jumpToGoal, jumpToLocation: jumpToLocation}))));
    };
    return Panel;
}(React.Component));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(Panel);
//# sourceMappingURL=Panel.js.map