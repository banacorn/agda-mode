import * as React from 'react';
import * as Promise from 'bluebird';
import { connect } from 'react-redux';

import { View, Location as Loc } from '../../types';
import { jumpToLocation } from '../actions';

// Atom shits
type CompositeDisposable = any;
var { CompositeDisposable } = require('atom');
declare var atom: any;

interface Props {
    jumpToLocation: (loc: Loc) => void;
}

const mapDispatchToProps = (dispatch: any) => ({
    jumpToLocation: (loc: Loc) => {
        dispatch(jumpToLocation(loc));
    }
})



class Location extends React.Component<Props, void> {
    private subscriptions: CompositeDisposable;
    private locationLink: HTMLElement;
    private locationPath: string;

    constructor() {
        super()
        this.subscriptions = new CompositeDisposable;
        this.locationPath = '';
    }

    componentDidMount() {
        this.subscriptions.add(atom.tooltips.add(this.locationLink, {
            title: this.locationPath,
            delay: 0
        }));
    }

    componentWillUnmount() {
        this.subscriptions.dispose();
    }


    render() {
        const location = this.props.children as Loc;
        const { jumpToLocation } = this.props;

        if (location.path)
            this.locationPath += `${location.path}:`;
        if (location.isSameLine)
            this.locationPath += `${location.range.start.row + 1},${location.range.start.column + 1}-${location.range.end.column + 1}`;
        else
            this.locationPath += `${location.range.start.row + 1},${location.range.start.column + 1}-${location.range.end.row + 1},${location.range.end.column + 1}`;

        return (
            <span
                className="text-subtle location icon icon-link"
                onClick={() => {
                    jumpToLocation(location);
                }}
                ref={(ref) => {
                    this.locationLink = ref;
                }}
            ></span>
        )
    }
}

export default connect<any, any, any>(
    null,
    mapDispatchToProps
)(Location);
