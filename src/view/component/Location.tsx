import * as React from 'react';
import * as Promise from 'bluebird';
import { connect } from 'react-redux';

import { View, Location as Loc } from '../../types';
import { jumpToLocation } from '../actions';

interface Props {
    jumpToLocation: (loc: Loc) => void;
}

const mapDispatchToProps = (dispatch: any) => ({
    jumpToLocation: (loc: Loc) => {
        dispatch(jumpToLocation(loc));
    }
})



class Location extends React.Component<Props, void> {
    render() {
        const location = this.props.children as Loc;
        const { jumpToLocation } = this.props;

        let result = ``;
        if (location.path)
            result += `${location.path}:`;
        if (location.isSameLine)
            result += `${location.range.start.row + 1},${location.range.start.column + 1}-${location.range.end.column + 1}`;
        else
            result += `${location.range.start.row + 1},${location.range.start.column + 1}-${location.range.end.row + 1},${location.range.end.column + 1}`;

        return (
            <span
                className="text-subtle location"
                onClick={() => {
                    jumpToLocation(location);
                }}
            >{result}</span>
        )
    }
}

export default connect<any, any, any>(
    null,
    mapDispatchToProps
)(Location);
