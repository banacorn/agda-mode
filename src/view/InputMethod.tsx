import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import * as classNames from 'classnames';
import { View } from '../types';
type State = View.State;

interface InputMethodProps extends React.Props<any> {
    activate: boolean
};


const mapStateToProps = ({ inputMethodMode }: State) => {
    return {
        activate: inputMethodMode
    };
}

// const mapDispatchToProps = (dispatch: any) => {
//     return {
//     };
// };


class InputMethod extends React.Component<InputMethodProps, State> {
    render() {
        // const { word, subs, onSearch, lookupStatus } = this.props;
        const hidden = classNames({ 'hidden': !this.props.activate});

        return (
            <section className={hidden}>
                <h1>Hey</h1>
            </section>
        )
    }
}

export default connect(
    mapStateToProps,
    null
)(InputMethod);
