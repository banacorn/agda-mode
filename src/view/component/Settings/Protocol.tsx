import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash';
import * as classNames from 'classnames';
import { View, Parsed, Agda, ValidPath } from '../../../type';

//
// Response
//
interface ResProp extends React.HTMLProps<HTMLElement> {
    res: Parsed<Agda.Response>;
};

interface ResState {
    showRaw: boolean;
    fold: boolean;
}
class Response extends React.Component<ResProp, ResState> {
    constructor(props: ResProp) {
        super(props)
        this.state = {
            showRaw: false,
            fold: false
        };
        this.toggleShowRaw = this.toggleShowRaw.bind(this);
        this.toggleFold = this.toggleFold.bind(this);
    }

    toggleShowRaw() {
        this.setState({
            showRaw: !this.state.showRaw
        });
    }

    toggleFold() {
        this.setState({
            fold: !this.state.fold
        });
    }

    componentWillMount() {
        // keep 'HighlightingInfo_Direct' folded by default
        this.setState({
            fold: this.state.fold || _.includes([
                'HighlightingInfo_Direct'
            ], this.props.res.parsed.kind)
        });
    }

    render() {
        const { raw, parsed } = this.props.res;
        const pairs = _.toPairs(_.omit(parsed, 'kind'));
        return (<li>
            <button
                className='no-btn inline-block highlight'
                onClick={this.toggleShowRaw}
            >{parsed.kind}</button>
            <button
                className={`no-btn icon icon-${this.state.fold ? 'unfold' : 'fold'}`}
                onClick={this.toggleFold}
            ></button>
            { !this.state.fold &&
                (this.state.showRaw ?
                    <dl>{raw}</dl>
                    :
                    pairs.map((pair, i) => (
                        <dl key={i}>
                            <dt>{pair[0]}</dt>
                            <dd>{JSON.stringify(pair[1])}</dd>
                        </dl>
                    ))
                )
            }
        </li>)
    }
}

//
// Request-Response
//

interface ReqResProp extends React.HTMLProps<HTMLElement> {
    reqRes: View.ReqRes
};

class ReqRes extends React.Component<ReqResProp, {}> {
    constructor(props: ReqResProp) {
        super(props)
    }

    render() {
        const { request, responses } = this.props.reqRes;
        return (
            <li>
                <h3>Request</h3>
                <p className='agda-settings-protocol-request'>{request.raw}</p>
                <h3>Responses</h3>
                <ol className='agda-settings-protocol-responses'>{responses.map((res, i) =>
                    <Response res={res} key={i}/>
                )}</ol>
            </li>
        )
    }
}

//
//
//

type Props = React.HTMLProps<HTMLElement> & {};

class Protocol extends React.Component<Props, {}> {
    constructor(props) {
        super(props);
    }
    render() {
        return <section className={classNames('agda-settings-protocol', this.props.className)}>
                <p className='background-message'>
                    No Connection Established
                </p>
            </section>
    }
}

export default Protocol;
