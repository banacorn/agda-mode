import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash';
import * as classNames from 'classnames';
import { View } from '../../types';

interface Props extends View.DevState {
}

const mapStateToProps = (state: View.State) => {
    return {
        messages: state.dev.messages
    }
}

class Dev extends React.Component<Props, void> {
    render() {
        const { messages } = this.props;
        console.log(messages.length)
        return (
            <ol className="agda-dev-view">{messages.map((msg, i) =>
                    <li key={i} className={msg.kind}>
                        {msg.message}
                    </li>
            )}</ol>
        )
    }
}

export default connect<any, any, any>(
    mapStateToProps,
    null
)(Dev);
