import * as React from 'react';
import * as classNames from 'classnames';

import { View } from '../../../type';

type Props = React.HTMLProps<HTMLElement> & {
    back: () => void;
    path: View.SettingsPath;
};

class Breadcrumb extends React.Component<Props, {}> {
    constructor(props) {
        super(props);
    }

    render() {

        return (
            <nav className={this.props.className}>
                <p>
                    <a onClick={this.props.back}>Settings</a> > {this.props.path}
                </p>
            </nav>
        )
    }
}

export default Breadcrumb;
