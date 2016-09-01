import * as React from 'react';
import { connect } from 'react-redux';

declare var atom: any;

import { View, Error as E } from '../types';
import { updateMaxItemCount } from './actions';
import Expr from './Expr';
import Error from './Error';
import Location from './Location';


interface Props extends React.HTMLAttributes {
    banner: View.BannerItem[];
    body: View.Body;
    error: E;
    plainText: string;
    maxItemCount: number;
    onMaxItemCountChange: (count: number) => void;
    jumpToGoal: (index: number) => void;
}

const mapStateToProps = (state: View.State) => state.body
const mapDispatchToProps = (dispatch: any) => ({
    onMaxItemCountChange: (count: number) => {
        dispatch(updateMaxItemCount(count));
    }
})

class Body extends React.Component<Props, void> {
    componentDidMount() {
        atom.config.observe('agda-mode.maxItemCount', (newCount) => {
            this.props.onMaxItemCountChange(newCount);
        })
    }

    render() {
        const { banner, body, error, plainText, maxItemCount } = this.props;
        const { jumpToGoal } = this.props;
        const style = {
            maxHeight: `${maxItemCount * 40 + 10}px`
        }
        return (
            <section id="agda-body" className={this.props.className} style={style}>
                <ul className="list-group">{banner.map((item, i) =>
                    <li className="list-item banner-item" key={i}>
                        <span><span className="text-info">{item.label}</span> : </span>
                        <Expr jumpToGoal={jumpToGoal}>{item.type}</Expr>
                    </li>
                )}</ul>
                <ul className="list-group">{body.goal.map((item, i) =>
                    <li className="list-item body-item" key={i}>
                        <span><button className="no-btn text-info">{item.index}</button> : </span>
                        <Expr jumpToGoal={jumpToGoal}>{item.type}</Expr>
                    </li>
                )}{body.judgement.map((item, i) =>
                    <li className="list-item body-item" key={i}>
                        <span><span className="text-success">{item.expr}</span> : </span>
                        <Expr jumpToGoal={jumpToGoal}>{item.type}</Expr>
                    </li>
                )}{body.term.map((item, i) =>
                    <li className="list-item body-item" key={i}>
                        <Expr jumpToGoal={jumpToGoal}>{item.expr}</Expr>
                    </li>
                )}{body.meta.map((item, i) =>
                    <li className="list-item body-item" key={i}>
                        <span><span className="text-success">{item.index}</span> : </span>
                        <Expr jumpToGoal={jumpToGoal}>{item.type}</Expr>
                        <Location>{item.location}</Location>
                    </li>
                )}{body.sort.map((item, i) =>
                    <li className="list-item body-item" key={i}>
                        <span className="text-highlight">Sort </span>
                        <span className="text-warning">{item.index}</span>
                        <Location>{item.location}</Location>
                    </li>
                )}</ul>
                {error ? <Error className="error">{error}</Error> : null}
                {plainText ? <p>{plainText}</p> : null}
            </section>
        )
    }
}

export default connect<any, any, any>(
    mapStateToProps,
    mapDispatchToProps
)(Body);
