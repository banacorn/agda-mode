import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash';
import * as classNames from 'classnames';
import { View } from '../../../type';

//
// Message
//


interface MsgProp extends React.HTMLProps<HTMLElement> {
    message: View.DevMsg
};

class Message extends React.Component<MsgProp, {}> {
    render() {
        const { kind, raw, parsed } = this.props.message;

        if (kind === 'response') {
            return (
                <li className="protocol-message response">
                    <div className="protocol-message-item parsed">{parsed}</div>
                </li>
            )
        } else {
            return (
                <li className="protocol-message request">
                    <div className="protocol-message-item raw">{raw}</div>
                </li>
            )
        }
    }
}

//
//
//

type OwnProps = React.HTMLProps<HTMLElement> & {
    // core: Core;
}
type InjProps = View.Protocol;

type DispatchProps = {
    // navigate: (path: View.SettingsPath) => () => void
}

type Props = OwnProps & InjProps & DispatchProps;

function mapStateToProps(state: View.State): InjProps {
    return state.protocol
}

class Protocol extends React.Component<Props, {}> {
    constructor(props) {
        super(props);
        // this.state = {
        //     tabIndex: 0
        // };
        // this.tabClassName = this.tabClassName.bind(this);
        // this.panelClassName = this.panelClassName.bind(this);
        // this.handleClick = this.handleClick.bind(this);
    }
    render() {
        return (
            <section className={this.props.className}>
                <p>Current Protocol: Emacs-vanilla</p>
                <section className="agda-settings-protocol-message-list">
                    <ol>{this.props.messages.map((msg, i) =>
                        <Message message={msg} key={i} />
                    )}</ol>
                </section>
            </section>
        )
    }
}

export default connect<InjProps, DispatchProps, OwnProps>(
    mapStateToProps,
    null
)(Protocol);
