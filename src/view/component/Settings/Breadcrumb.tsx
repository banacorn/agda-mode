import * as React from 'react';
import * as classNames from 'classnames';

import { View } from '../../../type';

type Props = React.HTMLProps<HTMLElement> & {
    navigate: (path: View.SettingsURI) => () => void;
    uri: View.SettingsURI;
};

class Breadcrumb extends React.Component<Props, {}> {
    constructor(props) {
        super(props);
    }

    render() {
        let tier1, tier2;

        switch (this.props.uri) {
            case '/Connection':
                tier1 = <li><a href='#'><span className='icon icon-plug'>Connection</span></a></li>;
                break;
            case '/Protocol':
                tier1 = <li><a href='#'><span className='icon icon-comment-discussion'>Protocol</span></a></li>;
                break;
            default:
                tier1 = null;
                tier2 = null;
        }


        return (
            <nav className={classNames('agda-settings-breadcrumb', this.props.className)}>
                <ol className='breadcrumb'>
                    <li><a
                        onClick={this.props.navigate('/')}
                        href='#'><span className='icon icon-settings'>Settings</span></a>
                    </li>
                    {tier1}
                    {tier2}
                </ol>
            </nav>
        )
    }
}

export default Breadcrumb;
