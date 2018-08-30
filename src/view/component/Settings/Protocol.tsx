import * as React from 'react';
import { connect } from 'react-redux';
import * as classNames from 'classnames';
import { View, Agda } from '../../../type';
import { Core } from '../../../core';
import * as Action from '../../actions';

import ProtocolPanel from './Protocol/Panel';
import ProtocolLog from './Protocol/Log';

type OwnProps = React.HTMLProps<HTMLElement> & {
    core: Core;
}
type InjProps = {
    agda?: Agda.ValidPath;
    protocol: View.Protocol;
}

type DispatchProps = {
    limitLog: (shouldLimitLog: boolean) => void;
    navigate: (path: View.SettingsURI) => () => void;
}

type Props = OwnProps & InjProps & DispatchProps;


function mapDispatchToProps(dispatch): DispatchProps {
    return {
        limitLog: (shouldLimitLog: boolean) => {
            dispatch(Action.PROTOCOL.limitLog(shouldLimitLog));
        },
        navigate: (uri: View.SettingsURI) => () => {
            dispatch(Action.VIEW.navigate(uri));
        }
    };
}

function mapStateToProps(state: View.State): InjProps {
    return {
        agda: state.connection.agda,
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
                <ProtocolLog
                    log={this.props.protocol.log}
                    navigate={this.props.navigate}
                />
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
