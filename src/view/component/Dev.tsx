import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash';
import * as classNames from 'classnames';

// interface Props extends View.HeaderState {
//     // inputMethodActivated: boolean;
//     // mountAtPane: () => void;
//     // mountAtBottom: () => void;
//     // toggleDevView: () => void;
// }

// const mapStateToProps = (state: View.State) => {
//     return {
//         text: state.header.text,
//         style: state.header.style,
//         inputMethodActivated: state.inputMethod.activated
//     }
// }

class Dev extends React.Component<void, void> {
    render() {
        // const { text, style, inputMethodActivated } = this.props;
        // const { mountAtPane, mountAtBottom, toggleDevView } = this.props;
        // const classes = classNames({
        //     hidden: inputMethodActivated || _.isEmpty(text)
        // }, 'agda-header')
        return (
            <div>
                dev
            </div>
        )
    }
}

export default connect<any, any, any>(
    null,
    // mapStateToProps,
    null
)(Dev);
