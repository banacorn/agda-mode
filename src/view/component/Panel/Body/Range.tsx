import * as React from 'react';
import { EventEmitter } from 'events';

import { Agda } from '../../../../type';
import { EVENT } from '../../../actions';

// Atom shits
import { CompositeDisposable } from 'atom';
import View from '../../../../view';
import * as Atom from 'atom';



type Props = React.HTMLProps<HTMLElement> & {
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

    static toString(range: Agda.Syntax.Range): string {
        const lineNums = range.intervals.map((interval) => {
            if (interval.start[0] === interval.end[0])
                return `${interval.start[0]},${interval.start[1]}-${interval.end[1]}`
            else
                return `${interval.start[0]},${interval.start[1]}-${interval.end[0]},${interval.end[1]}`
        }).join(' ');

        if (range.source && lineNums) {
            return `${range.source}:${lineNums}`;
        }

        if (range.source && lineNums === '') {
            return `${range.source}`;
        }

        if (range.source === null) {
            return `${lineNums}`;
        }
    }

    static toAtomRanges(range: Agda.Syntax.Range): Atom.Range[] {
        return range.intervals.map(({ start, end }) => new Atom.Range(
            new Atom.Point(start[0] - 1, start[1] - 1),
            new Atom.Point(end[0] - 1, end[1] - 1),
        ));
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
        const { range, abbr } = this.props;
        return <View.EventContext.Consumer>
            {emitter => {
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
                        > {Range.toString(range)}</span>
                    )
                }
            }}
        </View.EventContext.Consumer>
    }
}
