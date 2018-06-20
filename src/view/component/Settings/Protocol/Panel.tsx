import * as React from 'react';
import * as classNames from 'classnames';

import { View } from '../../../../type';

type Props = React.HTMLProps<HTMLElement> & {
    // navigate: (path: View.SettingsURI) => () => void;
    // uri: View.SettingsURI;
};

class ProtocolPanel extends React.Component<Props, {}> {
    constructor(props) {
        super(props);
    }

    render() {
        const className = classNames(
            this.props.className,
            'agda-settings-protocol-panel'
        );
        return (
            <section className={className}>
                <div>Normal size</div>
                <div className='btn-group'>
                    <button className='btn'>One</button>
                    <button className='btn'>Two</button>
                    <button className='btn'>Three</button>
                </div>
            </section>
        )
    }
}

export default ProtocolPanel;
