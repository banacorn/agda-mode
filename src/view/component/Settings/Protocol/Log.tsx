import * as React from 'react';
import { View } from '../../../../type';


// interface ReqResProp extends React.HTMLProps<HTMLElement> {
//     reqRes: View.ReqRes
// };
//
// class ReqRes extends React.Component<ReqResProp, {}> {
//     constructor(props: ReqResProp) {
//         super(props)
//     }
//
//     render() {
//         const { request, responses } = this.props.reqRes;
//         return (
//             <li>
//                 <h3>Request</h3>
//                 <p className='agda-settings-protocol-request'>{request.raw}</p>
//                 <h3>Responses</h3>
//                 <ol className='agda-settings-protocol-responses'>{responses.map((res, i) =>
//                     <Response res={res} key={i}/>
//                 )}</ol>
//             </li>
//         )
//     }
// }


function ReqRes(props: {reqRes: View.ReqRes}) {
    return (
        <li className='agda-settings-protocol-log-item'>
            {JSON.stringify(props.reqRes.request.parsed.header.kind)}
        </li>
    )
}

type LogProps = React.HTMLProps<HTMLElement> & {
    log: View.ReqRes[];
};

export default function Log(props: LogProps) {
    return (
        <section className='agda-settings-protocol-log'>
            <ol>{props.log.map((reqRes, i) =>
                <ReqRes key={i} reqRes={reqRes} />
            )}</ol>
        </section>
    );
}
