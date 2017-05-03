import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import * as classNames from 'classnames';
import { View } from '../../type';
import CandidateSymbols from './CandidateSymbols';

type OwnProps = React.HTMLProps<HTMLElement> & {
    updateTranslation: (symbol: string) => void;
    insertCharacter: (char: string) => void;
    chooseSymbol: (symbol: string) => void;
}
type InjProps = View.InputMethodState;
type Props = OwnProps & InjProps;

function mapStateToProps(state: View.State): InjProps {
    return state.inputMethod;
}

class InputMethod extends React.Component<Props, void> {
    render() {
        const { activated, buffer, translation, further, keySuggestions, updateTranslation, insertCharacter, chooseSymbol, candidateSymbols } = this.props;
        const hideEverything = classNames({ 'hidden': !activated}, 'input-method');
        const hideBuffer = classNames({ 'hidden': _.isEmpty(buffer)}, 'inline-block', 'buffer');
        return (
            <section className={hideEverything}>
                <div className="keyboard">
                    <div className={hideBuffer}>{buffer}</div>
                    <div className="keys btn-group btn-group-sm">
                        {keySuggestions.map(key => <button
                            className="btn"
                            onClick={() => insertCharacter(key)}
                            key={key}
                        >{key}</button>)}
                    </div>
                </div>
                <CandidateSymbols
                    updateTranslation={updateTranslation}
                    chooseSymbol={chooseSymbol}
                    candidates={candidateSymbols}
                />
            </section>
        )
    }
}

export default connect<InjProps, {}, OwnProps>(
    mapStateToProps
)(InputMethod);
