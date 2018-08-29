import * as React from 'react';

import { Agda } from '../../../../type';
import { EVENT } from '../../../actions';
import View from '../../../../view';



type Props = React.HTMLProps<HTMLElement> & {
    range: Agda.Syntax.Range;
}

export default class Link extends React.Component<Props, {}> {
    constructor(props: Props) {
        super(props)
    }

    render() {
        const { range } = this.props;
        return <View.EventContext.Consumer>{emitter => (
            <span
                onClick={() => { emitter.emit(EVENT.JUMP_TO_RANGE, range); }}
                onMouseOver={() => { emitter.emit(EVENT.MOUSE_OVER, range); }}
                onMouseOut={() => { emitter.emit(EVENT.MOUSE_OUT, range); }}
            >{this.props.children}</span>
        )}</View.EventContext.Consumer>
    }
}
