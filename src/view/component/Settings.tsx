import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash';
import * as classNames from 'classnames';

import { View } from '../../types';


interface Props {
    mountingPosition: View.MountingPoint
}

const mapStateToProps = (state: View.State) => ({
    mountingPosition: state.view.mountAt
});

class Settings extends React.Component<Props, void> {
    render() {
        const { mountingPosition } = this.props;
        const toggleMountingPosition = classNames({
            activated: mountingPosition === View.MountingPoint.Pane
        }, 'no-btn');
        return (
            <ul className="agda-settings">
                <li>
                    <button className={toggleMountingPosition}>
                        <span className="icon icon-versions"></span>
                    </button>
                </li>
            </ul>
        )
    }
}

export default connect<any, any, any>(
    null,
    null
)(Settings);
