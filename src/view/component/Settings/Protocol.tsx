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

    // case 'HighlightingInfo_Direct':
    //     return (<li>
    //         <span className='inline-block highlight'>HighlightingInfo Direct</span>
    //         {JSON.stringify(parsed.annotations)}
    //     </li>)
    // case 'HighlightingInfo_Indirect':
    //     return (<li>
    //         <span className='inline-block highlight'>HighlightingInfo Indirect</span>
    //         <dl>
    //             <dt>filepath</dt>
    //             <dd>{parsed.filepath}</dd>
    //         </dl>
    //     </li>)
    // case 'Status':
    //     return (<li>
    //         <span className='inline-block highlight'>Status</span>
    //         <dl>
    //             <dt>typechecked</dt>
    //             <dd>{JSON.stringify(parsed.checked)}</dd>
    //         </dl>
    //         <dl>
    //             <dt>display implicit arguments</dt>
    //             <dd>{JSON.stringify(parsed.showImplicit)}</dd>
    //         </dl>
    //     </li>)
    // case 'JumpToError':
    //     return (<li>
    //         <span className='inline-block highlight'>Jump to Error</span>
    //         <dl>
    //             <dt>filepath</dt>
    //             <dd>{parsed.filepath}</dd>
    //         </dl>
    //         <dl>
    //             <dt>position</dt>
    //             <dd>{parsed.position}</dd>
    //         </dl>
    //     </li>)
class Response extends React.Component<ResProp, {}> {
    constructor() {
        super()
    }
    render() {
        const { raw, parsed } = this.props.res;
        switch (parsed.kind) {
            default:
                const pairs = _.toPairs(_.omit(parsed, 'kind'));
                return (<li>
                    <span className='inline-block highlight'>{parsed.kind}</span>
                    {pairs.map((pair, i) => (
                        <dl key={i}>
                            <dt>{pair[0]}</dt>
                            <dd>{JSON.stringify(pair[1])}</dd>
                        </dl>
                    ))}
                </li>)
        }
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
