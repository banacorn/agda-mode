import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import * as classNames from 'classnames';

declare var atom: any;

import { View, Error as E, Location as Loc } from '../../types';
import { updateMaxBodyHeight, jumpToGoal, jumpToLocation } from '../actions';
import Expr from './Expr';
import Error from './Error';
import Location from './Location';


interface Props extends React.HTMLAttributes {
    banner: View.BannerItem[];
    body: View.Body;
    error: E;
    plainText: string;
    maxBodyHeight: number;
    onMaxBodyHeightChange: (count: number) => void;
    jumpToGoal: (index: number) => void;
    jumpToLocation: (loc: Loc) => void;
}

const mapStateToProps = (state: View.State) => state.body
const mapDispatchToProps = (dispatch: any) => ({
    onMaxBodyHeightChange: (count: number) => {
        dispatch(updateMaxBodyHeight(count));
    },
    jumpToGoal: (index: number) => {
        dispatch(jumpToGoal(index));
    },
    jumpToLocation: (loc: Loc) => {
        dispatch(jumpToLocation(loc));
    }
})

class Body extends React.Component<Props, void> {
    componentDidMount() {
        atom.config.observe('agda-mode.maxBodyHeight', (newHeight) => {
            this.props.onMaxBodyHeightChange(newHeight - this.props.maxBodyHeight);
        })
    }

    render() {
        const { banner, body, error, plainText, maxBodyHeight } = this.props;
        const { jumpToGoal, jumpToLocation } = this.props;
        const otherProps = _.omit(this.props, ['banner', 'body', 'error', 'plainText', 'maxBodyHeight', 'jumpToGoal', 'jumpToLocation', 'onMaxBodyHeightChange', 'className']);
        const classes = classNames(this.props.className, `native-key-bindings`, 'agda-body');
        const style = {
            maxHeight: `${maxBodyHeight}px`
        }
        return (
            <section
                className={classes}
                tabIndex="-1"
                style={style}
                {...otherProps}
            >
                <ul className="list-group">{banner.map((item, i) =>
                    <li className="list-item banner-item" key={i}>
                        <span><span className="text-info">{item.label}</span> : </span>
                        <Expr>{item.type}</Expr>
                    </li>
                )}</ul>
                <ul className="list-group">{body.goal.map((item, i) =>
                    <li className="list-item body-item" key={i}>
                        <div className="item-heading">
                            <button className="no-btn text-info" onClick={() => {
                                const index = parseInt(item.index.substr(1));
                                jumpToGoal(index);
                            }}>{item.index}</button>
                            <span> : </span>
                        </div>
                        <div className="item-body">
                            <Expr>{item.type}</Expr>
                        </div>
                    </li>
                )}{body.judgement.map((item, i) =>
                    <li className="list-item body-item" key={i}>
                        <div className="item-heading">
                            <span className="text-success">{item.expr}</span>
                            <span> : </span>
                        </div>
                        <div className="item-body">
                            <Expr>{item.type}</Expr>
                        </div>
                    </li>
                )}{body.term.map((item, i) =>
                    <li className="list-item body-item" key={i}>
                        <div className="item-body">
                            <Expr>{item.expr}</Expr>
                        </div>
                    </li>
                )}{body.meta.map((item, i) =>
                    <li className="list-item body-item" key={i}>
                        <div className="item-heading">
                            <span className="text-success">{item.index}</span>
                            <span> : </span>
                        </div>
                        <div className="item-body">
                            <Expr>{item.type}</Expr>
                            <Location>{item.location}</Location>
                        </div>
                    </li>
                )}{body.sort.map((item, i) =>
                    <li className="list-item body-item" key={i}>
                        <div className="item-heading">
                            <span className="text-highlight">Sort </span>
                            <span className="text-warning">{item.index}</span>
                        </div>
                        <div className="item-body">
                            <Location>{item.location}</Location>
                        </div>
                    </li>
                )}</ul>
                {error ? <Error>{error}</Error> : null}
                {plainText ? <p>{plainText}</p> : null}
            </section>
        )
    }
}

export default connect<any, any, any>(
    mapStateToProps,
    mapDispatchToProps
)(Body);
