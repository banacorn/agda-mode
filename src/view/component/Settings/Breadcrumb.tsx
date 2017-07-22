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
        let category;
        switch (this.props.path) {
            case 'Connections':
                category = <li><a href="#"><span className="icon icon-plug">Connections</span></a></li>;
                break;
            default:
                category = null;
        }


        return (
            <nav className={classNames('breadcrumb', this.props.className)}>
                <ol className="breadcrumb">
                    <li><a
                        id="breadcrumb-settings"
                        onClick={this.props.back}
                        href="#"><span className="icon icon-settings">Settings</span></a>
                    </li>
                    {category}
                </ol>
            </nav>
        )
    }
}

export default Breadcrumb;
