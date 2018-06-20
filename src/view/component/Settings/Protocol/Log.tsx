import * as React from 'react';
import * as classNames from 'classnames';

import { View } from '../../../../type';

type Props = React.HTMLProps<HTMLElement> & {
    // navigate: (path: View.SettingsURI) => () => void;
    // uri: View.SettingsURI;
};

class Log extends React.Component<Props, {}> {
    constructor(props) {
        super(props);
    }

    render() {
        const className = classNames(
            this.props.className,
            'agda-settings-protocol-log'
        );
        return (
            <section className={className}>
                123123123
            </section>
        )
    }
}

export default Log;
