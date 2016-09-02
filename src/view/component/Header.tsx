import * as React from 'react';
import { connect } from 'react-redux';
import * as classNames from 'classnames';

import { View } from '../../types';

function toHeaderStyle(type: View.HeaderStyle): string {
    switch (type) {
        case View.HeaderStyle.Error:     return 'error';
        case View.HeaderStyle.Warning:   return 'warning';
        case View.HeaderStyle.Judgement: return 'info';
        case View.HeaderStyle.Value:     return 'success';
        case View.HeaderStyle.PlainText: return 'plain-text';
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
        }, `text-${toHeaderStyle(style)}`)
        return (
            <h1 className={classes}>{text}</h1>
        )
    }
}

export default connect<any, any, any>(
    mapStateToProps,
    null
)(Header);
