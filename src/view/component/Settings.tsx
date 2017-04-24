import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash';
import * as classNames from 'classnames';
// import { View } from '../../type';

import Connections from './Settings/Connections';
import Conversations from './Settings/Conversations';

interface Props extends React.HTMLProps<HTMLElement> {
}

interface State {
    tabIndex: number
}


// const mapStateToProps = (state: View.State) => {
//     return {
//         messages: state.dev.messages,
//         lsp: state.dev.lsp
//     }
// }

class Settings extends React.Component<Props, State> {
    constructor(props) {
        super(props);
        this.state = {
            tabIndex: 0
        };
        this.tabClassName = this.tabClassName.bind(this);
        this.panelClassName = this.panelClassName.bind(this);
        this.handleClick = this.handleClick.bind(this);
    }
    render() {
        return (
            <section className="agda-settings">
                <nav>
                    <ol>
                        <li
                            className={this.tabClassName(0)}
                            onClick={this.handleClick(0)}
                        ><span className='icon icon-plug'>Connections</span></li>
                        <li
                            className={this.tabClassName(1)}
                            onClick={this.handleClick(1)}
                        ><span className='icon icon-comment-discussion'>Conversations</span></li>
                    </ol>
                </nav>
                <Connections className={this.panelClassName(0)} />
                <Conversations className={this.panelClassName(1)}>
                    1
                </Conversations>
            </section>
        )
    }

    tabClassName(tabIndex: number) {
        return this.state.tabIndex === tabIndex ? 'selected' : null;
    }

    panelClassName(tabIndex: number) {
        return classNames('settings-panel', {
            hidden: this.state.tabIndex !== tabIndex
        })
    }


    handleClick(tabIndex: number) {
        return () => {
            this.setState({
                tabIndex: tabIndex
            });
        }
    }

}

export default connect()(Settings);
