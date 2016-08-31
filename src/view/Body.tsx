import * as React from 'react';
import { connect } from 'react-redux';

import { View } from '../types';
import Expr from './Expr';
import Error from './Error';
import Location from './Location';


const mapStateToProps = (state: View.State) => state.body

class Body extends React.Component<View.BodyState, void> {
    render() {
        const { banner, body, error, plainText } = this.props;
        return (
            <section>
                <ul className="list-group">{banner.map((item, i) =>
                    <li className="list-item" key={i}>
                        <span className="text-info">{item.label}</span>
                        <span>:</span>
                        <Expr>{item.type}</Expr>
                    </li>
                )}</ul>
                <ul className="list-group">{body.goal.map((item, i) =>
                    <li className="list-item" key={i}>
                        <button className="no-btn text-info">{item.index}</button>
                        <span>:</span>
                        <Expr>{item.type}</Expr>
                    </li>
                )}{body.judgement.map((item, i) =>
                    <li className="list-item" key={i}>
                        <span className="text-success">{item.expr}</span>
                        <span>:</span>
                        <Expr>{item.type}</Expr>
                    </li>
                )}{body.term.map((item, i) =>
                    <li className="list-item" key={i}>
                        <Expr>{item.expr}</Expr>
                    </li>
                )}{body.meta.map((item, i) =>
                    <li className="list-item" key={i}>
                        <span className="text-success">{item.index}</span>
                        <span>:</span>
                        <Expr>{item.type}</Expr>
                        <Location>{item.location}</Location>
                    </li>
                )}{body.sort.map((item, i) =>
                    <li className="list-item" key={i}>
                        <span className="text-highlight">Sort</span><span className="text-warning">{item.index}</span>
                        <Location>{item.location}</Location>
                    </li>
                )}</ul>
                {error ? <Error error={error}/> : null}
                <p>{plainText}</p>
            </section>
        )
    }
}

export default connect<any, any, any>(
    mapStateToProps,
    null
)(Body);
