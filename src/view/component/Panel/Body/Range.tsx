import * as React from 'react';
import { EventEmitter } from 'events';

import { Agda } from '../../../../type';
import { EVENT } from '../../../actions';

// Atom shits
import { CompositeDisposable } from 'atom';
import * as Atom from 'atom';

type Props = React.HTMLProps<HTMLElement> & {
    emitter: EventEmitter;
    range: Agda.Syntax.Range;
    abbr?: boolean;
}


export default class Range extends React.Component<Props, {}> {
    private subscriptions: Atom.CompositeDisposable;
    private link: HTMLElement;

    constructor(props: Props) {
        super(props)
        this.subscriptions = new CompositeDisposable;
    }

    componentDidMount() {
        if (this.props.abbr) {
            this.subscriptions.add(atom.tooltips.add(this.link, {
                title: JSON.stringify(this.props.range),
                delay: {
                    show: 0,
                    hide: 1000
                }
            }));
        }
    }

    componentWillUnmount() {
        this.subscriptions.dispose();
    }


    render() {
        const { emitter, range, abbr } = this.props;
        if (abbr) {
            return (
                <span
                    className="text-subtle range icon icon-link"
                    onClick={() => {
                        emitter.emit(EVENT.JUMP_TO_RANGE, range);
                    }}
                    ref={(ref) => {
                        this.link = ref;
                    }}
                ></span>
            )
        } else {
            return (
                <span
                    className="text-subtle range icon icon-link"
                    onClick={() => {
                        emitter.emit(EVENT.JUMP_TO_RANGE, range);
                    }}
                > {range.toString()}</span>
            )
        }
    }
}
