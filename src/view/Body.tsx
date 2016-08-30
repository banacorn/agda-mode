import * as React from 'react';
import { connect } from 'react-redux';
import * as classNames from 'classnames';

import { View } from '../types';

// function toHeaderStyle(type: View.HeaderStyle): string {
//     switch (type) {
//         case View.HeaderStyle.Error:     return 'error';
//         case View.HeaderStyle.Warning:   return 'warning';
//         case View.HeaderStyle.Judgement: return 'info';
//         case View.HeaderStyle.Value:     return 'success';
//         case View.HeaderStyle.PlainText: return 'plain-text';
//         default:                  return '';
//     }
// }

interface Props extends View.BodyState {
}

const mapStateToProps = (state: View.State) => state.body
//     return {
//         text: state.header.text,
//         style: state.header.style,
//         inputMethodActivated: state.inputMethod.activated
//     }
// }

class Body extends React.Component<Props, void> {
    render() {
        const { banner, body, error, plainText } = this.props;
        // const classes = classNames({
        //     hidden: inputMethodActivated
        // }, `text-${toHeaderStyle(style)}`)
        return (
            <section>
                <ul className="list-group">{banner.map((item, i) =>
                    <li className="list-item" key={i}>
                        <span className="text-info">{item.label}</span>
                        <span>:</span>
                    </li>
                )}</ul>
                <ul className="list-group">{body.goal.map((item, i) =>
                    <li className="list-item" key={i}>
                        <button className="no-btn text-info">{item.index}</button>
                        <span>:</span>
                    </li>
                )}{body.judgement.map((item, i) =>
                    <li className="list-item" key={i}>
                        <span className="text-success">{item.expr}</span>
                        <span>:</span>
                    </li>
                )}{body.term.map((item, i) =>
                    <li className="list-item" key={i}>
                    </li>
                )}{body.meta.map((item, i) =>
                    <li className="list-item" key={i}>
                        <span className="text-success">{item.index}</span>
                        <span>:</span>
                    </li>
                )}{body.sort.map((item, i) =>
                    <li className="list-item" key={i}>
                        <span className="text-highlight">Sort</span><span className="text-warning">{item.index}</span>
                    </li>
                )}</ul>
                <ul className="list-group">{plainText.map((item, i) =>
                    <li className="list-item" key={i}>
                        <span>{plainText}</span>
                    </li>
                )}</ul>
            </section>
        )
    }
}

export default connect<any, any, any>(
    mapStateToProps,
    null
)(Body);
