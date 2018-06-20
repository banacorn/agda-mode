import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash';
import * as classNames from 'classnames';
import { View, Parsed, Agda, ValidPath } from '../../../type';
import { Core } from '../../../core';
import * as Action from '../../actions';

import ProtocolPanel from './Protocol/Panel';
import ProtocolLog from './Protocol/Log';
//
// Response
//
interface ResProp extends React.HTMLProps<HTMLElement> {
    res: Parsed<Agda.Response>;
};

interface ResState {
    showRaw: boolean;
    fold: boolean;
}
class Response extends React.Component<ResProp, ResState> {
    constructor(props: ResProp) {
        super(props)
        this.state = {
            showRaw: false,
            fold: false
        };
        this.toggleShowRaw = this.toggleShowRaw.bind(this);
        this.toggleFold = this.toggleFold.bind(this);
    }

    toggleShowRaw() {
        this.setState({
            showRaw: !this.state.showRaw
        });
    }

    toggleFold() {
        this.setState({
            fold: !this.state.fold
        });
    }

    componentWillMount() {
        // keep 'HighlightingInfo_Direct' folded by default
        this.setState({
            fold: this.state.fold || _.includes([
                'HighlightingInfo_Direct'
            ], this.props.res.parsed.kind)
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
            <button
                className={`no-btn icon icon-${this.state.fold ? 'unfold' : 'fold'}`}
                onClick={this.toggleFold}
            ></button>
            { !this.state.fold &&
                (this.state.showRaw ?
                    <dl>{raw}</dl>
                    :
                    pairs.map((pair, i) => (
                        <dl key={i}>
                            <dt>{pair[0]}</dt>
                            <dd>{JSON.stringify(pair[1])}</dd>
                        </dl>
                    ))
                )
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
    constructor(props: ReqResProp) {
        super(props)
    }

    render() {
        const { request, responses } = this.props.reqRes;
        return (
            <li>
                <h3>Request</h3>
                <p className='agda-settings-protocol-request'>{request.raw}</p>
                <h3>Responses</h3>
                <ol className='agda-settings-protocol-responses'>{responses.map((res, i) =>
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
    core: Core;
}
type InjProps = {
    agda?: ValidPath;
    languageServer?: ValidPath;
    protocol: View.Protocol;
}

type DispatchProps = {
    limitLog: (shouldLimitLog: boolean) => void;
}

type Props = OwnProps & InjProps & DispatchProps;


function mapDispatchToProps(dispatch): DispatchProps {
    return {
        limitLog: (shouldLimitLog: boolean) => {
            dispatch(Action.PROTOCOL.limitLog(shouldLimitLog));
        },
    };
}

function mapStateToProps(state: View.State): InjProps {
    return {
        agda: state.connection.agda,
        languageServer: state.connection.languageServer,
        protocol: state.protocol
    }
}

class Protocol extends React.Component<Props, {}> {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <section className={classNames('agda-settings-protocol', this.props.className)}>
                <ProtocolPanel
                    limitLog={this.props.protocol.limitLog}
                    handleLogLimit={this.props.limitLog}
                />
                <ProtocolLog />
            </section>
        );

        // if (this.props.agda) {
        //     return (
        //         <section className={classNames('agda-settings-protocol', this.props.className)}>
        //             <h2>Protocol</h2>
        //             <p><span className='text-highlight'>Agda Version: </span>{this.props.agda.version.raw}</p>
        //             <p><span className='text-highlight'>Agda Location: </span>{this.props.agda.path}</p>
        //             <p><span className='text-highlight'>Current Protocol: </span>{this.props.languageServer ? 'LSP' : 'Vanilla'}</p>
        //             <h2>Log</h2>
        //             <ol className='agda-settings-protocol-log'>{this.props.protocol.log.map((reqRes, i) =>
        //                 <ReqRes reqRes={reqRes} key={i} />
        //             )}</ol>
        //         </section>
        //     )
        // } else {
        //     return (
        //         <section className={classNames('agda-settings-protocol', this.props.className)}>
        //             <p className='background-message'>
        //                 No Connection Established
        //             </p>
        //         </section>svedkacitron

        //     )
        // }
    }
}

export default connect<InjProps, DispatchProps, OwnProps>(
    mapStateToProps,
    mapDispatchToProps
)(Protocol);
