import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import * as classNames from 'classnames';
import { View } from '../types';
type State = View.State;

interface InputMethodProps extends React.Props<any> {
    activate: boolean,
    keySuggestion: string[]
};


const mapStateToProps = (state: State) => {
    return state.inputMethod
}

// const mapDispatchToProps = (dispatch: any) => {
//     return {
//     };
// };


class InputMethod extends React.Component<InputMethodProps, State> {
    render() {
        const { activate, keySuggestion } = this.props;
        const hidden = classNames({ 'hidden': !activate});

        return (
            <section className={hidden}>
                <h1>Hey</h1>
                {keySuggestion.map(key => <span key={key}>{key}</span>)}
            </section>
        )
    }
}

export default connect(
    mapStateToProps,
    null
)(InputMethod);
