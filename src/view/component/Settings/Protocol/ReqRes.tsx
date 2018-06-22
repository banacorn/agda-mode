import * as React from 'react';
import { View } from '../../../../type';
import * as classNames from 'classnames';

type Props = React.HTMLProps<HTMLElement> & {
};

export default function ReqRes(props: Props) {
    return (
        <section className={classNames('agda-settings-protocol-reqres', props.className)}>
            hi
        </section>
    );
}
