import * as React from 'react';
import * as _ from 'lodash';
import * as classNames from 'classnames';
import { View } from '../../../type';

interface Props extends React.HTMLProps<HTMLDivElement> {
    message: View.DevMsg
};

class Message extends React.Component<Props, void> {
    render() {
        const { kind, raw, parsed } = this.props.message;

        if (kind === 'response') {
            return (
                <li className={`dev-message response`}>
                    <div className={`dev-message-item raw`}>{raw}</div>
                    <div className={`dev-message-item parsed`}>{parsed}</div>
                </li>
            )
        } else {
            return (
                <li className={`dev-message request`}>
                    <div className={`dev-message-item raw`}>{raw}</div>
                </li>
            )
        }
    }
}
// {_.isEmpty(parsed)
//     ? null
//     : <div className={`dev-message parsed`}>[{parsed}]</div>}

export default Message;
