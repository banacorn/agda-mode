import * as _ from 'lodash';
import * as React from 'react';
import * as Promise from 'bluebird';
// import * as classNames from 'classnames';

import { View } from '../types';
import Expr from './Expr';

interface Props extends React.HTMLAttributes {
    jumpToGoal: (index: number) => void;
}

class Suggestion extends React.Component<Props, void> {
    render() {
        const { jumpToGoal } = this.props;
        const lines = this.props.children as string[];
        switch (lines.length) {
            case 0: return null
            case 1: return <p {...this.props} >Did you mean: <Expr jumpToGoal={jumpToGoal}>{lines[0]}</Expr> ?</p>
            default: return (
                <p {...this.props} >Did you mean: <Expr jumpToGoal={jumpToGoal}>{_.head(lines)}</Expr>
                    {_.tail(lines).map((line, i) => `\n        or${<Expr jumpToGoal={jumpToGoal}>{line}</Expr>}`)} ?
                </p>
            )
        }
    }
}

export default Suggestion;
