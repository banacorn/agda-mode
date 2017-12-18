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

interface ResState {
    showRaw: boolean;
}
class Response extends React.Component<ResProp, ResState> {
    constructor() {
        super()
        this.state = {
            showRaw: false
        };
        this.toggleShowRaw = this.toggleShowRaw.bind(this);
    }

    toggleShowRaw() {
        this.setState({
            showRaw: !this.state.showRaw
        });
    }

    render() {
        const { raw, parsed } = this.props.res;
        const pairs = _.toPairs(_.omit(parsed, 'kind'));
        return (<li>
            <button
                className='no-btn inline-block highlight'
                onClick={this.toggleShowRaw}
            >{parsed.kind}</button>
            { this.state.showRaw ?
                <dl>{raw}</dl>
                :
                pairs.map((pair, i) => (
                    <dl key={i}>
                        <dt>{pair[0]}</dt>
                        <dd>{JSON.stringify(pair[1])}</dd>
                    </dl>
                ))
            }
        </li>)
    }
}

//
// Request-Response
//

interface ReqResProp extends React.HTMLProps<HTMLElement> {
    reqRes: View.ReqRes
};

class ReqRes extends React.Component<ReqResProp, {}> {
    constructor() {
        super()
    }

    render() {
        const { request, responses } = this.props.reqRes;
        return (
            <li>
                <h3>Request</h3>
                <p className="agda-settings-protocol-request">{request.raw}</p>
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
                    <p><span className="text-highlight">Agda Version: </span>{connInfo.agda.version.raw}</p>
                    <p><span className="text-highlight">Agda Location: </span>{connInfo.agda.location}</p>
                    <p><span className="text-highlight">Current Protocol: </span>{connInfo.languageServer ? 'LSP' : 'Vanilla'}</p>
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
