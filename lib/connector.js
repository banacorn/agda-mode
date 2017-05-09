"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const _ = require("lodash");
const child_process_1 = require("child_process");
var duplex = require('duplexer');
const util_1 = require("./util");
const parser_1 = require("./parser");
class AutoConnectFailure extends Error {
    constructor(message) {
        super(message);
        this.message = message;
        this.name = 'AutoConnectFailure';
        Error.captureStackTrace(this, AutoConnectFailure);
    }
}
exports.AutoConnectFailure = AutoConnectFailure;
class ConnectionError extends Error {
    constructor(message, conn) {
        super(message);
        this.conn = conn;
        this.message = message;
        this.conn = conn;
        this.name = 'ConnectionError';
        Error.captureStackTrace(this, ConnectionError);
    }
}
exports.ConnectionError = ConnectionError;
class Connector {
    // private markers: any[];
    // public connections: Connection[];
    constructor(core) {
        // initialize previous connections
        // this.connections = [];
        this.core = core;
        // console.log(this.getConnections());
        // this.connect()
        //     .then((conn) => {
        //         // console.log(conn)
        //         this.addConnection(conn);
        //         conn.stream.on('data', (data) => {
        //             console.log(data.toString());
        //         });
        //     }).catch(AutoConnectFailure, (err) => {
        //         console.error(err);
        //         // this.core.view.store.dispatch(Action.CONNECTION.showSetupView(true));
        //     }).catch(ConnectionError, (err) => {
        //         console.error(err);
        //     }).catch((err) => {
        //         console.error(err);
        //     });
    }
    connect() {
        const previousConnections = getConnections();
        if (previousConnections.length === 0) {
            return autoConnect()
                .then(validate)
                .then(connect);
            // .catch(AutoConnectFailure, (err) => {
            //     console.log(this.core.view.store.dispatch(Action.CONNECTION.setupView(true)));
            //     // console.warn(err.message);
            // });
        }
        else {
            return Promise.resolve(previousConnections[0]);
        }
    }
}
exports.default = Connector;
//
// export function connect(): Promise<Connection> {
//     const previousConnections = getConnections();
//
//     if (previousConnections.length === 0) {
//         return autoConnect()
//             .then(validate)
//             .then(connect)
//             // .catch(AutoConnectFailure, (err) => {
//             //     console.log(this.core.view.store.dispatch(Action.CONNECTION.setupView(true)));
//             //     // console.warn(err.message);
//             // });
//     } else {
//         return Promise.resolve(previousConnections[0]);
//     }
// }
function getConnections() {
    const state = atom.config.get('agda-mode.internalState');
    return JSON.parse(state).connections;
}
exports.getConnections = getConnections;
//
// export function addConnection({ guid, uri, version }: Connection) {
//     const state = JSON.parse(atom.config.get('agda-mode.internalState'));
//     state.connections.push({ guid, uri, version });
//     atom.config.set('agda-mode.internalState', JSON.stringify(state));
// }
// export function removeConnection(guid: string) {
//     const state = JSON.parse(atom.config.get('agda-mode.internalState'));
//     _.remove(state.connections, (conn) => conn['guid'] === guid);
//     atom.config.set('agda-mode.internalState', JSON.stringify(state));
// }
function mkConnection(uri) {
    return {
        guid: util_1.guid(),
        uri: parser_1.parseFilepath(uri)
    };
}
exports.mkConnection = mkConnection;
// automatically searches for available Agda connections
function autoConnect() {
    if (process.platform === 'win32') {
        return Promise.reject(new AutoConnectFailure('win32'));
    }
    return new Promise((resolve, reject) => {
        child_process_1.exec(`which mama`, (error, stdout, stderr) => {
            if (error) {
                reject(new AutoConnectFailure(error.toString()));
            }
            else {
                resolve(mkConnection(stdout));
            }
        });
    });
}
exports.autoConnect = autoConnect;
function validate(conn) {
    return new Promise((resolve, reject) => {
        child_process_1.exec(`${conn.uri} --version`, (error, stdout, stderr) => {
            if (conn.uri === '') {
                return reject(new ConnectionError(`The path must not be empty`, conn));
            }
            if (error) {
                // command not found
                if (error.message.toString().match(/command not found/)) {
                    return reject(new ConnectionError(`Unable to connect the given executable:\n${error.message}`, conn));
                    // command found however the arguments are invalid
                }
                else {
                    return reject(new ConnectionError(`This doesn't seem like Agda:\n${error.message}`, conn));
                }
            }
            if (stderr) {
                const message = `Spawned process returned with the following result (from stderr):\n\"${stdout.toString()}\"`;
                return reject(new ConnectionError(message, conn));
            }
            const result = stdout.toString().match(/^Agda version (.*)(?:\r\n?|\n)$/);
            if (result) {
                // normalize version number to valid semver
                const rawVerNum = result[1];
                const semVerNum = _.take((result[1] + '.0.0.0').replace('-', '.').split('.'), 3).join('.');
                conn.version = {
                    raw: rawVerNum,
                    sem: semVerNum
                };
                resolve(conn);
            }
            else {
                const message = `Doesn't seem like Agda to me: \n\"${stdout.toString()}\"`;
                reject(new ConnectionError(message, conn));
            }
        });
    });
}
exports.validate = validate;
function connect(conn) {
    return new Promise((resolve, reject) => {
        const agdaProcess = child_process_1.spawn(conn.uri, ['--interaction']);
        agdaProcess.on('error', (error) => {
            reject(new ConnectionError(error.message, conn));
        });
        agdaProcess.on('close', (signal) => {
            reject(new ConnectionError(`exit with signal ${signal}`, conn));
        });
        conn.stream = duplex(agdaProcess.stdin, agdaProcess.stdout);
        resolve(conn);
    });
}
exports.connect = connect;
function close(conn) {
    conn.stream.end();
}
exports.close = close;
//# sourceMappingURL=connector.js.map