import * as React from 'react';
import * as Syntax from '../../../../type/agda/syntax';

// Atom shits
import { CompositeDisposable } from 'atom';
import * as Atom from 'atom';

import Link from './Link'

type Props = React.HTMLProps<HTMLElement> & {
    range: Syntax.Position.Range;
    abbr?: boolean;
}



export default class Range extends React.Component<Props, {}> {
    private subscriptions: Atom.CompositeDisposable;
    private link: HTMLElement;

    constructor(props: Props) {
        super(props)
        this.subscriptions = new CompositeDisposable;
    }

    static toString(range: Syntax.Position.Range): string {
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

    static toAtomRanges(range: Syntax.Position.Range): Atom.Range[] {
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
        if (abbr) {
            return (
                <Link jump range={range}>
                    <span
                        className="text-subtle range icon icon-link"
                        ref={(ref) => {
                            this.link = ref;
                        }}
                    ></span>
                </Link>
            )
        } else {
            return (
                <Link jump range={range}>
                    <span
                        className="text-subtle range icon icon-link"
                    >{Range.toString(range)}</span>
                </Link>
            )
        }
    }
}
