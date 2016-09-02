import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import * as classNames from 'classnames';
import { View } from '../../types';
import CandidateSymbols from './CandidateSymbols';

interface InputMethodProps extends View.InputMethodState {
    updateTranslation: (symbol: string) => void,
    insertCharacter: (char: string) => void,
    chooseSymbol: (symbol: string) => void
};


const mapStateToProps = (state: View.State) => {
    return state.inputMethod
}


class InputMethod extends React.Component<InputMethodProps, void> {
    render() {
        const { activated, buffer, translation, further, keySuggestions, updateTranslation, insertCharacter, chooseSymbol, candidateSymbols } = this.props;
        const hideEverything = classNames({ 'hidden': !activated});
        const hideBuffer = classNames({ 'hidden': _.isEmpty(buffer)}, 'inline-block');
        return (
            <section id="agda-input-method" className={hideEverything}>
                <div id="keyboard">
                    <div id="buffer" className={hideBuffer}>{buffer}</div>
                    <div id="keys" className="btn-group btn-group-sm">
                        {keySuggestions.map(key => <button
                            className="btn"
                            onClick={() => insertCharacter(key)}
                            key={key}
                        >{key}</button>)}
                    </div>
                </div>
                <CandidateSymbols
                    id="candidates"
                    updateTranslation={updateTranslation}
                    chooseSymbol={chooseSymbol}
                    candidates={candidateSymbols}
                />
            </section>
        )
    }
}

export default connect<any, any, any>(
    mapStateToProps,
    null
)(InputMethod);
