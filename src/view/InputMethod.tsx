import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import * as classNames from 'classnames';
import { View } from '../types';
import { translate } from "../input-method";
type State = View.State;

interface InputMethodProps extends React.Props<any> {
    activate: boolean,
    buffer: string
};


const mapStateToProps = (state: State) => {
    return state.inputMethod
}

// const mapDispatchToProps = (dispatch: any) => {
//     return {
//     };
// };

// {keySuggestions.map(key => <span
//     className="btn"
//     key={key}
//     >{key}</span>)}

class InputMethod extends React.Component<InputMethodProps, State> {
    render() {
        const { activate, buffer } = this.props;
        const { translation, further, keySuggestions, candidateSymbols } = translate(buffer);

        // const {  }
        const hidden = classNames({ 'hidden': !activate});

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
