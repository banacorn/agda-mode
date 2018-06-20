import * as React from 'react';
import { connect } from 'react-redux';
import * as classNames from 'classnames';
import * as Action from '../../../actions';

import { View } from '../../../../type';

type OwnProps = React.HTMLProps<HTMLElement> & {};
type InjProps = {
    protocol: View.Protocol;
}
type DispatchProps = {
    limitLog: (shouldLimitLog: boolean) => void;
}

function mapDispatchToProps(dispatch): DispatchProps {
    return {
        limitLog: (shouldLimitLog: boolean) => {
            dispatch(Action.PROTOCOL.limitLog(shouldLimitLog));
        },
    };
}

function mapStateToProps(state: View.State): InjProps {
    return {
        protocol: state.protocol
    }
}

type Props = OwnProps & InjProps & DispatchProps;

class ProtocolPanel extends React.Component<Props, {}> {
    constructor(props) {
        super(props);
    }

    render() {
        const className = classNames(
            this.props.className,
            'agda-settings-protocol-panel'
        );
        return (
            <section className={className}>
                <label className='input-label'>
                    <input className='input-toggle' type='checkbox' onChange={this.handleLogLimit} /> Keep only the last 10 requests
                </label>
            </section>
        )
    }

    handleLogLimit(event) {
        this.props.limitLog(event.target.checked);
    }
}

export default connect<InjProps, DispatchProps, OwnProps>(
    mapStateToProps,
    mapDispatchToProps
)(ProtocolPanel);
