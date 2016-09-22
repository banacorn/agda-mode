import * as React from 'react';
import * as _ from 'lodash';
import * as classNames from 'classnames';
import { View } from '../../../types';

interface Props extends React.HTMLProps<HTMLDivElement> {
    message: View.DevMsg
};

class Message extends React.Component<Props, void> {
    render() {
        const { kind, raw, processed } = this.props.message;
        return (
            <li className={kind}>
                {raw}
            </li>
        )
    }
}

export default Message;
