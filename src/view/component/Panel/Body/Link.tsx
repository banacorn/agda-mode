import * as React from 'react';

import { Agda } from '../../../../type';
import { EVENT } from '../../../actions';
import View from '../../../../view';



type Props = React.HTMLProps<HTMLElement> & {
    range: Agda.Syntax.Position.Range;
    jump?: boolean;
    hover?: boolean;
}

export default class Link extends React.Component<Props, {}> {
    constructor(props: Props) {
        super(props)
    }

    render() {
        const { range, jump, hover } = this.props;
        return <View.EventContext.Consumer>{emitter => (
            <span className='link'
                onClick={() => { if (jump) emitter.emit(EVENT.JUMP_TO_RANGE, range); }}
                onMouseOver={() => { if (hover) emitter.emit(EVENT.MOUSE_OVER, range); }}
                onMouseOut={() => { if (hover) emitter.emit(EVENT.MOUSE_OUT, range); }}
            >{this.props.children}</span>
        )}</View.EventContext.Consumer>
    }
}
