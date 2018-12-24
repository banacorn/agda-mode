import * as _ from 'lodash';
import { combineReducers } from 'redux';
import { handleActions, Action } from 'redux-actions';
import { View, Agda } from '../type';
import { VIEW, PROTOCOL, CONNECTION } from './actions';

// const initialInternalState = InternalState.get();
const defaultState: View.State = {
    view: {
        activated: false,
        mounted: false,
        mountAt: {
            previous: null,
            current: View.MountingPosition.Bottom
        },
        settingsView: false,
        settingsURI: {
            path: '/'
        }
    },
    connection: {
        querying: false,
        agda: null,
        agdaMessage: '',
    },
    protocol: {
        log: [],
        id: 0,
        limitLog: true
    }
};

const view = handleActions<View.ViewState, VIEW>({
    [VIEW.ACTIVATE]: (state, _) => ({ ...state,
        activated: true
    }),
    [VIEW.DEACTIVATE]: (state, _) => ({ ...state,
        activated: false
    }),
    [VIEW.MOUNT]: (state, _) => ({ ...state,
        mounted: true
    }),
    [VIEW.UNMOUNT]: (state, _) => ({ ...state,
        mounted: false
    }),
    [VIEW.MOUNT_AT_PANE]: (state, _) => ({ ...state,
        mountAt: {
            previous: state.mountAt.current,
            current: View.MountingPosition.Pane
        }
    }),
    [VIEW.MOUNT_AT_BOTTOM]: (state, _) => ({ ...state,
        mountAt: {
            previous: state.mountAt.current,
            current: View.MountingPosition.Bottom
        }
    }),
    [VIEW.TOGGLE_SETTINGS_VIEW]: (state, _) => ({ ...state,
        settingsView: !state.settingsView
    }),
    [VIEW.NAVIGATE]: (state, action: Action<VIEW.NAVIGATE>) => ({ ...state,
        settingsView: true,
        settingsURI: action.payload
    }),
}, defaultState.view);

const connection = handleActions<View.ConnectionState, CONNECTION>({
    [CONNECTION.CONNECT_AGDA]: (state, action: Action<CONNECTION.CONNECT_AGDA>) => ({ ...state,
        querying: false,
        agdaMessage: '',
        agda: action.payload
    }),
    [CONNECTION.DISCONNECT_AGDA]: (state, action: Action<CONNECTION.DISCONNECT_AGDA>) => ({
        querying: false,
        agda: null,
        agdaMessage: '',
    }),
    [CONNECTION.START_QUERYING]: (state, action: Action<CONNECTION.START_QUERYING>) => ({ ...state,
        querying: true
    }),
    [CONNECTION.STOP_QUERYING]: (state, action: Action<CONNECTION.STOP_QUERYING>) => ({ ...state,
        querying: false
    }),
    [CONNECTION.SET_AGDA_MESSAGE]: (state, action: Action<CONNECTION.SET_AGDA_MESSAGE>) => ({ ...state,
        agdaMessage: action.payload
    }),
}, defaultState.connection);

function logResponses(log: View.ReqRes[], response: View.Parsed<Agda.Response>[]): View.ReqRes[] {
    if (log.length > 0) {
        // append only to the last ReqRes;
        const tail = _.tail(log);
        let { id, request, responses } = _.first(log);
        return _.concat([{
            id,
            request,
            responses: _.concat(responses, response)
        }], tail);
    } else {
        return log;
    }

}

function logRequest(state: View.Protocol, request: View.Parsed<Agda.Request>): View.ReqRes[] {
    let log = _.concat([{
        id: state.id,
        request,
        responses: []
    }], state.log);
    if (state.limitLog && log.length > 10) {
        return _.take(log, 10);
    } else {
        return log;
    }
}

const protocol = handleActions<View.Protocol, PROTOCOL>({
    [PROTOCOL.LOG_REQUEST]: (state, action: Action<PROTOCOL.LOG_REQUEST>) => ({ ...state,
        log: logRequest(state, action.payload),
        id: state.id + 1
    }),
    [PROTOCOL.LOG_RESPONSES]: (state, action: Action<PROTOCOL.LOG_RESPONSES>) => ({ ...state,
        log: logResponses(state.log, action.payload)
    }),
    [PROTOCOL.LIMIT_LOG]: (state, action: Action<PROTOCOL.LIMIT_LOG>) => ({ ...state,
        limitLog: action.payload
    }),
}, defaultState.protocol);

// export default reducer;
export default combineReducers<View.State>({
    view,
    connection,
    protocol,
});
