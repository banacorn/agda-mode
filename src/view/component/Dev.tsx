import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash';
import * as classNames from 'classnames';
import { View } from '../../types';

import Panel from './Dev/Panel';
import Message from './Dev/Message';

interface Props extends View.DevState {
}

const mapStateToProps = (state: View.State) => {
    return {
        messages: state.dev.messages,
        lsp: state.dev.lsp
    }
}

class Dev extends React.Component<Props, void> {
    render() {
        const { messages, lsp } = this.props;
        const messagesClassList = classNames({
            hidden: lsp,
        }, "agda-dev-body");
        return (
            <section className="agda-dev-view">
                <Panel/>
                <ol className={messagesClassList}>{messages.map((msg, i) =>
                    <Message
                        key={i}
                        message={msg}
                    />
                )}</ol>
            </section>
        )
    }
}

export default connect<any, any, any>(
    mapStateToProps,
    null
)(Dev);
