import * as React from 'react';
import * as Promise from 'bluebird';
import { EventEmitter } from 'events';

import { View, Location as Loc } from '../../type';
import { EVENT } from '../actions';

// Atom shits
import { CompositeDisposable } from 'atom';

type Props = React.HTMLProps<HTMLElement> & {
    emitter: EventEmitter;
    abbr?: boolean;
}

class Location extends React.Component<Props, {}> {
    private subscriptions: Atom.CompositeDisposable;
    private locationLink: HTMLElement;
    private locationPath: string;
    private location: Loc;

    constructor() {
        super()
        this.subscriptions = new CompositeDisposable;
        this.locationPath = '';
    }

    componentWillMount() {
        this.location = this.props.children as Loc;
        // concatenating Location path
        if (this.location.path)
            this.locationPath += `${this.location.path}:`;
        if (this.location.isSameLine)
            this.locationPath += `${this.location.range.start.row + 1},${this.location.range.start.column + 1}-${this.location.range.end.column + 1}`;
        else
            this.locationPath += `${this.location.range.start.row + 1},${this.location.range.start.column + 1}-${this.location.range.end.row + 1},${this.location.range.end.column + 1}`;
    }

    componentDidMount() {
        if (this.props.abbr) {
            this.subscriptions.add(atom.tooltips.add(this.locationLink, {
                title: this.locationPath,
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
        const { emitter, abbr } = this.props;

        if (abbr) {
            return (
                <span
                    className="text-subtle location icon icon-link"
                    onClick={() => {
                        emitter.emit(EVENT.JUMP_TO_LOCATION, this.location);
                    }}
                    ref={(ref) => {
                        this.locationLink = ref;
                    }}
                ></span>
            )
        } else {
            return (
                <span
                    className="text-subtle location icon icon-link"
                    onClick={() => {
                        emitter.emit(EVENT.JUMP_TO_LOCATION, this.location);
                    }}
                > {this.locationPath}</span>
            )
        }
    }
}

export default Location;
