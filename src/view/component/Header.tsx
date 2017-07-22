import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash';
import * as classNames from 'classnames';

import { View } from '../../type';
import Dashboard from './Dashboard';
import Core from '../../core';

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

type OwnProps = React.HTMLProps<HTMLElement> & {
    core: Core;
}
type InjProps = View.HeaderState & {
    inputMethodActivated: boolean;
};
type Props = OwnProps & InjProps;

function mapStateToProps(state: View.State): InjProps {
    return {
        text: state.header.text,
        style: state.header.style,
        inputMethodActivated: state.inputMethod.activated
    }
}

class Header extends React.Component<Props, {}> {
    render() {
        const { text, style, core, inputMethodActivated } = this.props;
        const classes = classNames({
            hidden: inputMethodActivated || _.isEmpty(text)
        }, 'agda-header')
        return (
            <div className={classes}>
                <h1 className={`text-${toStyle(style)}`}>{text}</h1>
                <Dashboard
                    core={core}
                />
            </div>
        )
    }
}

export default connect<InjProps, {}, OwnProps>(
    mapStateToProps,
    null
)(Header);
