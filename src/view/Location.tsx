import * as React from 'react';
import * as Promise from 'bluebird';

import { View } from '../types';

class Location extends React.Component<React.HTMLAttributes, void> {
    render() {
        const location = this.props.children as View.Location;

        let result = ``;
        if (location.path)
            result += `${location.path}:`;
        if (location.isSameLine)
            result += `${location.range.start.row + 1},${location.range.start.column + 1}-${location.range.end.column + 1}`;
        else
            result += `${location.range.start.row + 1},${location.range.start.column + 1}-${location.range.end.row + 1},${location.range.end.column + 1}`;

        return (
            <span className="text-subtle location">{result}</span>
        )
    }
}

export default Location;
