import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash';
import * as classNames from 'classnames';

import { View } from '../../../types';
import * as Action from '../../actions';

// Atom shits
type CompositeDisposable = any;
var { CompositeDisposable } = require('atom');
declare var atom: any;

interface Props {
    accumulate: boolean;
    lsp: boolean;
    // dispatch to the store
    clearAll: () => void;
    toogleAccumulate: () => void;
    toggleLSP: () => void;
}

const mapStateToProps = (state: View.State) => ({
    accumulate: state.dev.accumulate,
    lsp: state.dev.lsp
});

const mapDispatchToProps = (dispatch: any) => ({
    clearAll: () => {
        dispatch(Action.devClearAll());
    },
    toogleAccumulate: () => {
        dispatch(Action.devToggleAccumulate());
    },
    toggleLSP: () => {
        dispatch(Action.devToggleLSP());
    }
});

class DevPanel extends React.Component<Props, void> {
    private subscriptions: CompositeDisposable;
    private clearAllButton: HTMLElement;
    private toggleAccumulateButton: HTMLElement;
    private toggleLSPButton: HTMLElement;

    constructor() {
        super();
        this.subscriptions = new CompositeDisposable;
    }

    componentDidMount() {
        this.subscriptions.add(atom.tooltips.add(this.clearAllButton, {
            title: 'clear all messages',
            delay: 100
        }));
        this.subscriptions.add(atom.tooltips.add(this.toggleAccumulateButton, {
            title: 'accumulate messages',
            delay: 100
        }));
        this.subscriptions.add(atom.tooltips.add(this.toggleLSPButton, {
            title: 'language protocol server',
            delay: 100
        }));
    }

    componentWillUnmount() {
        this.subscriptions.dispose();
    }

    render() {
        const { accumulate, lsp } = this.props;
        const { clearAll, toogleAccumulate, toggleLSP } = this.props;
        const clearAllButtonClassList = classNames({
            hidden: lsp
        }, 'btn');
        const toggleAccumulateClassList = classNames({
            selected: accumulate,
            hidden: lsp
        }, 'btn');
        const toggleLSPClassList = classNames({
            selected: lsp,
        }, 'btn');
        return (
            <section className="agda-dev-panel">
                <div className="btn-group">
                    <button
                        className={clearAllButtonClassList}
                        onClick={clearAll}
                        ref={(ref) => {
                            this.clearAllButton = ref;
                        }}
                    >
                        <span className="icon icon-trashcan"></span>
                    </button>
                    <button
                        className={toggleAccumulateClassList}
                        onClick={toogleAccumulate}
                        ref={(ref) => {
                            this.toggleAccumulateButton = ref;
                        }}
                    >
                        <span className="icon icon-inbox"></span>
                    </button>
                </div>
                <div className="btn-group">
                    <button
                        className={toggleLSPClassList}
                        onClick={toggleLSP}
                        ref={(ref) => {
                            this.toggleLSPButton = ref;
                        }}
                    >
                        <span className="icon icon-radio-tower"></span>
                        <span className="button-label">LSP</span>
                    </button>
                </div>
            </section>
        )
    }
}

export default connect<any, any, any>(
    mapStateToProps,
    mapDispatchToProps
)(DevPanel);
