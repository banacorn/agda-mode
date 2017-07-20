import * as React from 'react';
import * as classNames from 'classnames';

import { View } from '../../../type';

type Props = React.HTMLProps<HTMLElement> & {
    path: View.SettingsPath;
};

class Breadcrumb extends React.Component<Props, {}> {
    constructor(props) {
        super(props);
    }

    render() {
        // hide the whole thing when not navigating the pages
        const hideBreadcrumb = classNames({
            'hidden': this.props.path === 'Nothing'
        })
        return (
            <nav className={hideBreadcrumb}>
                <p>
                    Settings > {this.props.path}
                </p>
            </nav>
        )
    }
}

export default Breadcrumb;
