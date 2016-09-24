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
    // dispatch to the store
    clearAll: () => void;
    toogleAccumulate: () => void;
}

const mapStateToProps = (state: View.State) => ({
    accumulate: state.dev.accumulate
});

const mapDispatchToProps = (dispatch: any) => ({
    clearAll: () => {
        dispatch(Action.devClearAll());
    },
    toogleAccumulate: () => {
        dispatch(Action.devToggleAccumulate());
    }
});

class DevPanel extends React.Component<Props, void> {
    private subscriptions: CompositeDisposable;
    private clearAllButton: HTMLElement;
    private toggleAccumulateButton: HTMLElement;

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
    }

    componentWillUnmount() {
        this.subscriptions.dispose();
    }

    render() {
        const { accumulate } = this.props;
        const { clearAll, toogleAccumulate } = this.props;
        const toggleAccumulateClassList = classNames({
            activated: accumulate,
        }, 'no-btn');
        return (
            <section className="agda-dev-panel">
                <ul className="button-groups">
                    <li>
                        <button
                            className={toggleAccumulateClassList}
                            onClick={toogleAccumulate}
                            ref={(ref) => {
                                this.toggleAccumulateButton = ref;
                            }}
                        >
                            <span className="icon icon-inbox"></span>
                        </button>
                    </li>
                </ul>
                <ul className="button-groups">
                    <li>
                        <button
                            className="no-btn"
                            onClick={clearAll}
                            ref={(ref) => {
                                this.clearAllButton = ref;
                            }}
                        >
                            <span className="icon icon-trashcan"></span>
                        </button>
                    </li>
                </ul>
            </section>
        )
    }
}

export default connect<any, any, any>(
    mapStateToProps,
    mapDispatchToProps
)(DevPanel);
