import * as React from 'react';
import { connect } from 'react-redux';

import { View } from '../types';

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

const mapStateToProps = (state: View.State) => {
    return state.header
}

class Header extends React.Component<View.HeaderState, void> {
    render() {
        const { text, style } = this.props;
        return (
            <h1>{text}</h1>
        )
    }
}

export default connect<any, any, any>(
    mapStateToProps,
    null
)(Header);
