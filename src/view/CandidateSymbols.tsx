import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import * as classNames from 'classnames';
import { View } from '../types';
// import Core from '../core';
import { replaceSymbol } from './actions';
var { CompositeDisposable } = require('atom');
type CompositeDisposable = any;
declare var atom: any;


interface CandidateSymbolsProps extends React.Props<any> {
    // core: Core,
    candidates: string[]
    replaceSymbol: (symbol: string) => void
};


const mapStateToProps = (state: View.State) => ({
    candidates: state.inputMethod.candidateSymbols
})

const mapDispatchToProps = (dispatch: any) => ({
    replaceSymbol: (symbol: string) => {
        dispatch(replaceSymbol(symbol))
    }
})


// the nth candicate
type Frame = {
    index: number
}


class CandidateSymbols extends React.Component<CandidateSymbolsProps, Frame> {

    private subscriptions: CompositeDisposable;

    constructor() {
        super();
        this.state = {
            index: 0
        };
    }

    // lifecycle hook, subscribes to Atom's core events here
    componentDidMount() {
        const commands = {
            'core:move-up': (event) => {
                if (!_.isEmpty(this.props.candidates)) {
                    const newIndex = _.max([
                        0,
                        this.state.index - 10
                    ])
                    this.setState({ index: newIndex });
                    // this.replaceSymbol(this.selected[0]);
                    event.stopImmediatePropagation();
                }
            },
            'core:move-right': (event) => {
                if (!_.isEmpty(this.props.candidates)) {
                    const newIndex = _.min([
                        this.props.candidates.length - 1,
                        this.state.index + 1
                    ])
                    this.setState({ index: newIndex });
                    // this.replaceSymbol(this.selected[0]);
                    event.stopImmediatePropagation();
                }
            },
            'core:move-down': (event) => {
                if (!_.isEmpty(this.props.candidates)) {
                    const newIndex = _.min([
                        this.props.candidates.length - 1,
                        this.state.index + 10
                    ])
                    this.setState({ index: newIndex });
                    // this.replaceSymbol(this.selected[0]);
                    event.stopImmediatePropagation();
                }
            },
            'core:move-left': (event) => {
                if (!_.isEmpty(this.props.candidates)) {
                    const newIndex = _.max([
                        0,
                        this.state.index - 1
                    ])
                    this.setState({ index: newIndex });
                    // this.replaceSymbol(this.selected[0]);
                    event.stopImmediatePropagation();
                }
            }
        }

        this.subscriptions = atom.commands.add('atom-text-editor.agda-mode-input-method-activated', commands);
    }

    render() {
        const { candidates } = this.props;
        const start = Math.floor(this.state.index / 10) * 10;
        const position = this.state.index % 10;
        const frameLeft = candidates.slice(start, this.state.index);
        const frameRight = candidates.slice(this.state.index + 1, start + 10);
        const selected = candidates[this.state.index];
        return (
            <div id="candidate-symbols" className="btn-group btn-group-sm">
                {frameLeft.map(key => <button
                    className="btn"
                    key={key}
                >{key}</button>)}
                <button
                    className="btn selected"
                    key={selected}
                >{selected}</button>
                {frameRight.map(key => <button
                    className="btn"
                    key={key}
                >{key}</button>)}
            </div>
        )
    }
}

export default connect(
    mapStateToProps,
    null
)(CandidateSymbols);
