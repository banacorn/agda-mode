import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash';
import * as classNames from 'classnames';

import { View } from '../../types';

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
        const classes = classNames({
            hidden: inputMethodActivated || _.isEmpty(text)
        }, `text-${toStyle(style)}`)
        return (
            <h1 className={classes}>{text}</h1>
        )
    }
}

export default connect<any, any, any>(
    mapStateToProps,
    null
)(Header);
