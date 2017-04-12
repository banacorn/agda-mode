import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash';
import * as classNames from 'classnames';
// import { View } from '../../../types';
import ConnectionItem from './ConnectionItem';

interface Props extends React.HTMLProps<HTMLElement> {
}

interface State {
}


// const mapStateToProps = (state: View.State) => {
//     return {
//         messages: state.dev.messages,
//         lsp: state.dev.lsp
//     }
// }

class Connections extends React.Component<Props, State> {
    constructor(props) {
        super(props);
        // this.state = {
        //     tabIndex: 0
        // };
        // this.tabClassName = this.tabClassName.bind(this);
        // this.panelClassName = this.panelClassName.bind(this);
        // this.handleClick = this.handleClick.bind(this);
    }
    render() {
        // <button className='btn btn-error icon icon-trashcan inline-block-tight'>Delete</button>
        const {dispatch, ...props} = this.props;
        return (
            <section {...props}>
                <section className="current-connection">
                    <h2><span className="icon icon-plug">Current Connection</span></h2>
                    <ConnectionItem
                        connected={true}
                        version="Agda-2.5.2"
                        uri="path/to/agda"
                    />
                </section>
                <section className="previous-connections">
                    <h2><span className="icon icon-repo">Previous Connections</span></h2>
                    <p>
                        A list of previously established connections to Agda
                    </p>
                    <ol>
                        <li>
                            <ConnectionItem
                                connected={false}
                                version="Agda-2.6"
                                uri="path/to/agda"
                            />
                        </li>
                        <li>
                            <ConnectionItem
                                connected={false}
                                version="Agda-2.3.2"
                                uri="path/to/agda"
                            />
                        </li>
                        <li>
                            <ConnectionItem
                                connected={false}
                                version="Agda-2.3.2"
                                uri="path/to/agda"
                            />
                        </li>
                        <li>
                            <ConnectionItem
                                connected={false}
                                version="Agda-2.5"
                                uri="path/to/agda"
                            />
                        </li>
                        <li>
                            <ConnectionItem
                                connected={false}
                                version="Agda-2.3.2"
                                uri="path/to/agda"
                            />
                        </li>
                        <li>
                            <ConnectionItem
                                connected={false}
                                version="Agda-2.3.2"
                                uri="path/to/agda"
                            />
                        </li>
                        <li>
                            <ConnectionItem
                                connected={false}
                                version="Agda-2.3.2"
                                uri="path/to/agda"
                            />
                        </li>
                    </ol>
                </section>
            </section>
        )
    }


}

export default connect<any, any, any>(
    null,
    null
)(Connections);
