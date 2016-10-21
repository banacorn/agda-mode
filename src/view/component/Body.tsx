import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import * as classNames from 'classnames';
import { EventEmitter } from 'events';

declare var atom: any;

import { View, Error as E, Location as Loc } from '../../types';
import { updateMaxBodyHeight, EVENT } from '../actions';
import Expr from './Expr';
import Error from './Error';
import Location from './Location';


interface Props extends React.HTMLAttributes {
    emitter: EventEmitter;
    banner: View.BannerItem[];
    body: View.Body;
    error: E;
    plainText: string;
    maxBodyHeight: number;
    onMaxBodyHeightChange: (count: number) => void;
    mountAtBottom: boolean;
}

const mapStateToProps = (state: View.State) => {
    let obj = state.body;
    obj['mountAtBottom'] = state.view.mountAt.current === View.MountingPosition.Bottom;
    return obj;
}

const mapDispatchToProps = (dispatch: any) => ({
    onMaxBodyHeightChange: (count: number) => {
        dispatch(updateMaxBodyHeight(count));
    }
})

class Body extends React.Component<Props, void> {
    componentDidMount() {
        atom.config.observe('agda-mode.maxBodyHeight', (newHeight) => {
            this.props.onMaxBodyHeightChange(newHeight);
        })
    }

    render() {
        const { emitter, banner, body, error, plainText, maxBodyHeight, mountAtBottom } = this.props;
        const classes = classNames(this.props.className, `native-key-bindings`, 'agda-body');
        const style = mountAtBottom ? {
            maxHeight: `${maxBodyHeight}px`
        } : {};
        return (
            <section
                className={classes}
                tabIndex={-1}
                style={style}
            >
                <ul className="list-group">{banner.map((item, i) =>
                    <li className="list-item banner-item" key={i}>
                        <div className="item-heading text-info">{item.label}</div>
                        <div className="item-colon"><span> : </span></div>
                        <div className="item-body">
                            <Expr emitter={emitter}>{item.type}</Expr>
                        </div>
                    </li>
                )}</ul>
                <ul className="list-group">{body.goal.map((item, i) =>
                    <li className="list-item body-item" key={i}>
                        <div className="item-heading">
                            <button className="no-btn text-info" onClick={() => {
                                const index = parseInt(item.index.substr(1));
                                emitter.emit(EVENT.JUMP_TO_GOAL, index);
                            }}>{item.index}</button>
                        </div>
                        <div className="item-colon"><span> : </span></div>
                        <div className="item-body">
                            <Expr emitter={emitter}>{item.type}</Expr>
                        </div>
                    </li>
                )}{body.judgement.map((item, i) =>
                    <li className="list-item body-item" key={i}>
                        <div className="item-heading">
                            <span className="text-success">{item.expr}</span>
                        </div>
                        <div className="item-colon"><span> : </span></div>
                        <div className="item-body">
                            <Expr emitter={emitter}>{item.type}</Expr>
                        </div>
                    </li>
                )}{body.term.map((item, i) =>
                    <li className="list-item body-item" key={i}>
                        <div className="item-body">
                            <Expr emitter={emitter}>{item.expr}</Expr>
                        </div>
                    </li>
                )}{body.meta.map((item, i) =>
                    <li className="list-item body-item" key={i}>
                        <div className="item-heading">
                            <span className="text-success">{item.index}</span>
                        </div>
                        <div className="item-colon"><span> : </span></div>
                        <div className="item-body">
                            <Expr emitter={emitter}>{item.type}</Expr>
                            <Location abbr emitter={emitter}>{item.location}</Location>
                        </div>
                    </li>
                )}{body.sort.map((item, i) =>
                    <li className="list-item body-item" key={i}>
                        <div className="item-heading">
                            <span className="text-highlight">Sort </span>
                            <span className="text-warning">{item.index}</span>
                        </div>
                        <div className="item-body">
                            <Location abbr emitter={emitter}>{item.location}</Location>
                        </div>
                    </li>
                )}</ul>
                {error ? <Error emitter={emitter}>{error}</Error> : null}
                {plainText ? <p>{plainText}</p> : null}
            </section>
        )
    }
}

export default connect<any, any, any>(
    mapStateToProps,
    mapDispatchToProps
)(Body);
