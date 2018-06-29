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

type ReqResProps = {
    reqRes: View.ReqRes;
    navigate: (path: View.SettingsURI) => () => void;
};

function ReqRes(props: ReqResProps) {
    const {id, request, responses } = props.reqRes;
    return (
        <li
            onClick={props.navigate({path: '/Protocol/*', param: id})}
        >
            {id} : {JSON.stringify(request.parsed.header.kind)}  <span className='badge'>{responses.length}</span>

        </li>
    )
}

type LogProps = React.HTMLProps<HTMLElement> & {
    log: View.ReqRes[];
    navigate: (path: View.SettingsURI) => () => void;
};

export default function Log(props: LogProps) {
    return (
        <section className='agda-settings-protocol-log'>
            <ol>{props.log.map((reqRes) =>
                <ReqRes key={reqRes.id} reqRes={reqRes} navigate={props.navigate} />
            )}</ol>
        </section>
    );
}
