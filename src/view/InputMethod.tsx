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
        const hideEverything = classNames({ 'hidden': !activated});
        const hideBuffer = classNames({ 'hidden': _.isEmpty(buffer)}, "inline-block");
        return (
            <section className={hideEverything} id="panel-input-method">
                <div id="input-buffer-container">
                    <div id="input-buffer" className={hideBuffer}>{buffer}</div>
                    <div id="suggestion-keys" className="btn-group btn-group-sm">
                        {keySuggestions.map(key => <button
                            className="btn"
                            key={key}
                        >{key}</button>)}
                    </div>
                </div>
            </section>
        )
    }
}

export default connect(
    mapStateToProps,
    null
)(InputMethod);
