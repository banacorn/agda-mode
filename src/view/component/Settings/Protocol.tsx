import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash';
import * as classNames from 'classnames';
import { View, Parsed, Agda, ConnectionInfo } from '../../../type';

//
// Response
//
interface ResProp extends React.HTMLProps<HTMLElement> {
    res: Parsed<Agda.Response>;
};

class Response extends React.Component<ResProp, {}> {
    constructor() {
        super()
    }
    render() {
        const { raw, parsed } = this.props.res;
        return (
            <li>
                {JSON.stringify(parsed)}
            </li>
        )
    }
}

//
// Request-Response
//

interface ReqResProp extends React.HTMLProps<HTMLElement> {
    reqRes: View.ReqRes
};

interface ReqResState {
    showParsed: boolean;
}

class ReqRes extends React.Component<ReqResProp, ReqResState> {
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
        // const { kind, raw, parsed } = this.props.message;
        // return (
        //     <li onClick={this.toggleShowParsed}>
        //         <div>{this.state.showParsed && parsed
        //             ?   JSON.stringify(parsed)
        //             :   raw
        //         }</div>
        //     </li>
        // )
        const { request, responses } = this.props.reqRes;
        return (
            <li>
                <h3>Request</h3>
                <p>{JSON.stringify(request.raw)}</p>
                <h3>Responses</h3>
                <ol className="agda-settings-protocol-responses">{responses.map((res, i) =>
                    <Response res={res} key={i}/>
                )}</ol>
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
type InjProps = {
    connection?: ConnectionInfo;
    protocol: View.Protocol;
}

type DispatchProps = {
    // navigate: (path: View.SettingsPath) => () => void
}

type Props = OwnProps & InjProps & DispatchProps;

function mapStateToProps(state: View.State): InjProps {
    return {
        connection: _.find(state.connection.connectionInfos, {
            guid: state.connection.connected
        }),
        protocol: state.protocol
    }
}

class Protocol extends React.Component<Props, {}> {
    constructor(props) {
        super(props);
    }
    render() {
        const connInfo = this.props.connection;
        if (connInfo) {
            return (
                <section className={classNames("agda-settings-protocol", this.props.className)}>
                    <h2>Protocol</h2>
                    <p>Current Protocol: {connInfo.languageServer ? 'LSP' : 'Vanilla'}</p>
                    <h2>Log</h2>
                    <ol className="agda-settings-protocol-log">{this.props.protocol.log.map((reqRes, i) =>
                        <ReqRes reqRes={reqRes} key={i} />
                    )}</ol>
                </section>
            )
        } else {
            return <section className={classNames("agda-settings-protocol", this.props.className)}>
                    <p className='background-message'>
                        No Connections
                    </p>
                </section>
        }
    }
}


// <h2>Messages</h2>
// <h3>Requests</h3>
// <ol className="agda-settings-protocol-message-list">{requests.map((msg, i) =>
//     <Message message={msg} key={i} />
// )}</ol>
// <h3>Responses</h3>
// <ol className="agda-settings-protocol-message-list">{responses.map((msg, i) =>
//     <Message message={msg} key={i} />
// )}</ol>

export default connect<InjProps, DispatchProps, OwnProps>(
    mapStateToProps,
    null
)(Protocol);
