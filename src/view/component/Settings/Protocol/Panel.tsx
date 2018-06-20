import * as React from 'react';

type Props = React.HTMLProps<HTMLElement> & {
    limitLog: boolean;
    handleLogLimit: (shouldLimitLog: boolean) => void;
};

export default function ProtocolPanel(props: Props) {

    function handleLogLimit(event) {
        props.handleLogLimit(event.target.checked);
    }

    return (
        <section className='agda-settings-protocol-panel'>
            <label className='input-label'>
                <input className='input-toggle' type='checkbox' onChange={handleLogLimit} checked={props.limitLog} /> Keep only the last 10 requests
            </label>
        </section>
    );
}
