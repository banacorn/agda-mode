import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash';
import * as classNames from 'classnames';

import { View } from '../../types';
import Settings from './Settings';

function toStyle(type: View.Style): string {
    switch (type) {
        case View.Style.Error:     return 'error';
        case View.Style.Warning:   return 'warning';
        case View.Style.Info:      return 'info';
        case View.Style.Success:   return 'success';
        case View.Style.PlainText: return 'plain-text';
        default:                  return '';
    }
}

interface Props extends View.HeaderState {
    inputMethodActivated: boolean;
    toggleSettingsView: () => void;
    mountAtPane: () => void;
    mountAtBottom: () => void;
}

const mapStateToProps = (state: View.State) => {
    return {
        text: state.header.text,
        style: state.header.style,
        inputMethodActivated: state.inputMethod.activated
    }
}

class Header extends React.Component<Props, void> {
    render() {
        const { text, style, inputMethodActivated } = this.props;
        const { mountAtPane, mountAtBottom, toggleSettingsView } = this.props;
        const classes = classNames({
            hidden: inputMethodActivated || _.isEmpty(text)
        }, 'agda-header')
        return (
            <div className={classes}>
                <h1 className={`text-${toStyle(style)}`}>{text}</h1>
                <Settings
                    toggleSettingsView={toggleSettingsView}
                    mountAtPane={mountAtPane}
                    mountAtBottom={mountAtBottom}
                />
            </div>
        )
    }
}

export default connect<any, any, any>(
    mapStateToProps,
    null
)(Header);
