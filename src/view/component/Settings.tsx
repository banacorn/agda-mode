import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash';
import * as classNames from 'classnames';
// import { View } from '../../type';
import Core from '../../core';

import Breadcrumb from './Settings/Breadcrumb';
import Connections from './Settings/Connections';
import Conversations from './Settings/Conversations';

type OwnProps = React.HTMLProps<HTMLElement> & {
    core: Core;
}
type InjProps = {
    // mountAt: {
    //     previous: View.MountingPosition,
    //     current: View.MountingPosition
    // };
    // settingsView: boolean;
}
type DispatchProps = {
    // handleMountAtPane: () => void
    // handleMountAtBottom: () => void;
    // handleToggleSettingsView: () => void;
}
type Props = OwnProps & InjProps & DispatchProps;

class Settings extends React.Component<Props, void> {
    constructor(props) {
        super(props);
        // this.tabClassName = this.tabClassName.bind(this);
        // this.panelClassName = this.panelClassName.bind(this);
        // this.handleClick = this.handleClick.bind(this);
    }
    render() {
        return (
            <section className="agda-settings">
                <Breadcrumb path={"Nothing"} />
            </section>
        )
    }

    // tabClassName(tabIndex: number) {
    //     return this.state.tabIndex === tabIndex ? 'selected' : null;
    // }
    //
    // panelClassName(tabIndex: number) {
    //     return classNames('settings-panel', {
    //         hidden: this.state.tabIndex !== tabIndex
    //     })
    // }
    //
    //
    // handleClick(tabIndex: number) {
    //     return () => {
    //         this.setState({
    //             tabIndex: tabIndex
    //         });
    //     }
    // }

}

export default Settings;


    // <nav>
    //     <ol>
    //         <li
    //             className={this.tabClassName(0)}
    //             onClick={this.handleClick(0)}
    //         ><span className='icon icon-plug'>Connections</span></li>
    //         <li
    //             className={this.tabClassName(1)}
    //             onClick={this.handleClick(1)}
    //         ><span className='icon icon-comment-discussion'>Conversations</span></li>
    //     </ol>
    // </nav>
// <Connections
//     core={this.props.core}
//     className={this.panelClassName(0)}
// />
// <Conversations className={this.panelClassName(1)}>
//     1
// </Conversations>
