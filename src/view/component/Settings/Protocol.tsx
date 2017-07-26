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

interface MsgState {
    showParsed: boolean;
}

class Message extends React.Component<MsgProp, MsgState> {
    constructor() {
        super()
        this.state = {
            showParsed: false
        };

        this.toggleShowParsed = this.toggleShowParsed.bind(this);
    }

    toggleShowParsed() {
        this.setState({
            showParsed: !this.state.showParsed
        });
    }

    render() {
        const { kind, raw, parsed } = this.props.message;
        return (
            <li onClick={this.toggleShowParsed}>
                <div>{this.state.showParsed && parsed
                    ?   parsed
                    :   raw
                }</div>
            </li>
        )
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
        const requests = this.props.messages.filter(msg => msg.kind === 'request');
        const responses = this.props.messages.filter(msg => msg.kind === 'response');

        return (
            <section className={classNames("agda-settings-protocol", this.props.className)}>
                <h2>Protocol</h2>
                <p>Current Protocol: Emacs-vanilla</p>
                <h2>Messages</h2>
                <h3>Requests</h3>
                <ol className="agda-settings-protocol-message-list">{requests.map((msg, i) =>
                    <Message message={msg} key={i} />
                )}</ol>
                <h3>Responses</h3>
                <ol className="agda-settings-protocol-message-list">{responses.map((msg, i) =>
                    <Message message={msg} key={i} />
                )}</ol>
            </section>
        )
    }
}

// <p>
//     <span className='inline-block highlight'>from Agda</span>
//     <span className='inline-block info'>to Agda</span>
// </p>
// <section className="agda-settings-protocol-message-list">
//     <ol>{this.props.messages.map((msg, i) =>
//         <Message message={msg} key={i} />
//     )}</ol>
// </section>
export default connect<InjProps, DispatchProps, OwnProps>(
    mapStateToProps,
    null
)(Protocol);
