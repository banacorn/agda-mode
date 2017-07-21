import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash';
import * as classNames from 'classnames';
// import { View } from '../../type';
import Core from '../../core';
import { View } from '../../type';
import * as Action from '../actions';

import Breadcrumb from './Settings/Breadcrumb';
import Connections from './Settings/Connections';
import Conversations from './Settings/Conversations';

type OwnProps = React.HTMLProps<HTMLElement> & {
    core: Core;
}
type InjProps = {
    path: View.SettingsPath
}

type DispatchProps = {
    navigate: (path: View.SettingsPath) => void
}
type Props = OwnProps & InjProps & DispatchProps;

function mapStateToProps(state: View.State): InjProps {
    return {
        path: state.settings
    }
}

function mapDispatchToProps(dispatch): DispatchProps {
    return {
        navigate: (path: View.SettingsPath) => {
            dispatch(Action.SETTINGS.navigate(path));
        }
    };
}
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
                <Breadcrumb path={this.props.path} />
                <ul>
                    <li
                        onClick={() => {
                            this.props.navigate("Connections")
                        }}
                    >
                        <span className='icon icon-plug'>Connections</span>
                    </li>
                    <li>
                        <span className='icon icon-comment-discussion'>Conversations</span>
                    </li>
                </ul>
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

export default connect<InjProps, DispatchProps, OwnProps>(
    mapStateToProps,
    mapDispatchToProps
)(Settings);


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
