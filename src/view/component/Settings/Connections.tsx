import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash';
import * as classNames from 'classnames';
// import { View } from '../../../types';

interface Props extends React.HTMLProps<HTMLElement> {
}

interface State {
}


// const mapStateToProps = (state: View.State) => {
//     return {
//         messages: state.dev.messages,
//         lsp: state.dev.lsp
//     }
// }

class Connections extends React.Component<Props, State> {
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
        const {children, dispatch, ...props} = this.props;
        return (
            <section {...props}>
                {children}
            </section>
        )
    }


}

export default connect<any, any, any>(
    null,
    null
)(Connections);
