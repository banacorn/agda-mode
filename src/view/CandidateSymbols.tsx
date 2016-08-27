import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import * as classNames from 'classnames';
import { View } from '../types';
var { CompositeDisposable } = require("atom");
type CompositeDisposable = any;
declare var atom: any;

interface CandidateSymbolsProps extends React.Props<any> {
    candidates: string[]
};


const mapStateToProps = (state: View.State) => ({
    candidates: state.inputMethod.candidateSymbols
})

// const mapDispatchToProps = (dispatch: any) => {
//     return {
//     };
// };

class CandidateSymbols extends React.Component<CandidateSymbolsProps, void> {
    private subscriptions: CompositeDisposable;
    // lifecycle hook, subscribes to Atom's core events here
    componentDidMount() {
        console.log("mount");
        const commands = {
            "core:move-up": (event) => {
                if (!_.isEmpty(this.props.candidates)) {
                    console.log("up");

                    // this.moveUp();
                    // this.replaceSymbol(this.selected[0]);
                    event.stopImmediatePropagation();
                }
            },
            "core:move-right": (event) => {
                if (!_.isEmpty(this.props.candidates)) {
                    console.log("right");
                    // this.moveRight();
                    // this.replaceSymbol(this.selected[0]);
                    event.stopImmediatePropagation();
                }
            },
            "core:move-down": (event) => {
                if (!_.isEmpty(this.props.candidates)) {
                    console.log("down");
                    // this.moveDown();
                    // this.replaceSymbol(this.selected[0]);
                    event.stopImmediatePropagation();
                }
            },
            "core:move-left": (event) => {
                if (!_.isEmpty(this.props.candidates)) {
                    console.log("left");
                    // this.moveLeft();
                    // this.replaceSymbol(this.selected[0]);
                    event.stopImmediatePropagation();
                }
            }
        }

        this.subscriptions = atom.commands.add("atom-text-editor.agda-mode-input-method-activated", commands);
    }

    render() {
        const { candidates } = this.props;
        return (
            <div id="candidate-symbols" className="btn-group btn-group-sm">
                {candidates.map(key => <button
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
