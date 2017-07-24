import * as React from 'react';
import * as classNames from 'classnames';

import { View } from '../../../type';

type Props = React.HTMLProps<HTMLElement> & {
    root: () => void;
    path: View.SettingsPath;
};

class Breadcrumb extends React.Component<Props, {}> {
    constructor(props) {
        super(props);
    }

    render() {
        let tier1, tier2;

        switch (this.props.path) {
            case '/Connections':
                tier1 = <li><a href="#"><span className="icon icon-plug">Connections</span></a></li>;
                break;
            case '/Connections/New':
                tier1 = <li><a href="#"><span className="icon icon-plug">Connections</span></a></li>;
                tier2 = <li><a href="#"><span className="icon icon-plus">New</span></a></li>;
                break;
            default:
                tier1 = null;
                tier2 = null;
        }


        return (
            <nav className={classNames('breadcrumb', this.props.className)}>
                <ol className="breadcrumb">
                    <li><a
                        id="breadcrumb-settings"
                        onClick={this.props.root}
                        href="#"><span className="icon icon-settings">Settings</span></a>
                    </li>
                    {tier1}
                    {tier2}
                </ol>
            </nav>
        )
    }
}

export default Breadcrumb;
