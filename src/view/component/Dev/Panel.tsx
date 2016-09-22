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
    // dispatch to the store
    clearAll: () => void
}

const mapStateToProps = (state: View.State) => ({
    // devView: state.view.devView
});

const mapDispatchToProps = (dispatch: any) => ({
    clearAll: () => {
        dispatch(Action.devClearAll());
    }
});

class DevPanel extends React.Component<Props, void> {
    private subscriptions: CompositeDisposable;
    private clearAllButton: HTMLElement;

    constructor() {
        super();
        this.subscriptions = new CompositeDisposable;
    }

    componentDidMount() {
        this.subscriptions.add(atom.tooltips.add(this.clearAllButton, {
            title: 'clear all messages',
            delay: 100

        }));
    }

    componentWillUnmount() {
        this.subscriptions.dispose();
    }

    render() {
        const { clearAll } = this.props;
        // const devViewClassList = classNames({
        //     activated: devView,
        //     hidden: !atom.inDevMode()
        // }, 'no-btn');
        // const toggleMountingPosition = classNames({
        //     activated: mountingPosition === View.MountingPosition.Pane
        // }, 'no-btn');
        return (
            <section className="agda-dev-panel">
                <ul className="button-groups">
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
    null,
    mapDispatchToProps
)(DevPanel);
