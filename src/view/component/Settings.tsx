import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash';
import * as classNames from 'classnames';

import { View } from '../../types';

// Atom shits
type CompositeDisposable = any;
var { CompositeDisposable } = require('atom');
declare var atom: any;

interface Props {
    mountingPosition: View.MountingPosition;
    mountAtPane: () => void;
    mountAtBottom: () => void;
}

const mapStateToProps = (state: View.State) => ({
    mountingPosition: state.view.mountAt
});

class Settings extends React.Component<Props, void> {
    private subscriptions: CompositeDisposable;
    private toggleMountingPositionButton: HTMLElement;


    constructor() {
        super();
        this.subscriptions = new CompositeDisposable;
    }

    componentDidMount() {
        this.subscriptions.add(atom.tooltips.add(this.toggleMountingPositionButton, {
            title: 'toggle panel docking position',
            delay: 300
        }));
    }

    componentWillUnmount() {
        this.subscriptions.dispose();
    }

    render() {
        const { mountingPosition } = this.props;
        const { mountAtPane, mountAtBottom } = this.props;
        const toggleMountingPosition = classNames({
            activated: mountingPosition === View.MountingPosition.Pane
        }, 'no-btn');
        return (
            <ul className="agda-settings">
                <li>
                    <button
                        className={toggleMountingPosition}
                        onClick={() => {
                            if (mountingPosition === View.MountingPosition.Bottom) {
                                mountAtPane();
                            } else {
                                mountAtBottom();
                            }
                        }}
                        ref={(ref) => {
                            this.toggleMountingPositionButton = ref;
                        }}
                    >
                        <span className="icon icon-versions"></span>
                    </button>
                </li>
            </ul>
        )
    }
}

export default connect<any, any, any>(
    mapStateToProps,
    null
)(Settings);
