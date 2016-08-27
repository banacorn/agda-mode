import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import * as classNames from 'classnames';
import { View } from '../types';

interface InputMethodProps extends React.Props<any> {
    activated: boolean,
    buffer: string,
    translation: string,
    further: boolean,
    keySuggestions: string[],
    candidateSymbols: string[]
};


const mapStateToProps = (state: View.State) => {
    return state.inputMethod
}

// const mapDispatchToProps = (dispatch: any) => {
//     return {
//     };
// };

class InputMethod extends React.Component<InputMethodProps, void> {

    render() {
        const { activated, buffer, translation, further, keySuggestions, candidateSymbols } = this.props;
        const hidden = classNames({ 'hidden': !activated});

        return (
            <section className={hidden} id="panel-input-method">
                {buffer}
                {keySuggestions.map(key => <span
                    className="btn"
                    key={key}
                    >{key}</span>)}
            </section>
        )
    }
}

export default connect(
    mapStateToProps,
    null
)(InputMethod);
