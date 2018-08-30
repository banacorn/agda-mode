import * as React from 'react';
import { View, Agda } from '../../../../type';
import * as classNames from 'classnames';
import * as _ from 'lodash';


//
// Response
//
type ResProp = React.HTMLProps<HTMLElement> & {
    res: View.Parsed<Agda.Response>;
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

type ReqResProp = React.HTMLProps<HTMLElement> & {
    log: View.ReqRes[];
    index: number;
};

export default function ReqRes(props: ReqResProp) {
    let reqRes = props.index !== undefined ? _.find(props.log, {id: props.index}) : undefined;
    if (reqRes) {
        const { request, responses } = reqRes;
        return (
            <section className={classNames('agda-settings-protocol-reqres', props.className)}>
                <h3>Request</h3>
                <p className='agda-settings-protocol-request'>{request.raw}</p>
                <h3>Responses</h3>
                <ol className='agda-settings-protocol-responses'>{responses.map((res, i) =>
                    <Response res={res} key={i}/>
                )}</ol>
            </section>
        )
    } else {
        return (
            <section className={classNames('agda-settings-protocol-reqres', props.className)}>
                <p className='background-message'>
                    Request Does Not Exist
                </p>
            </section>
        )
    }
}
