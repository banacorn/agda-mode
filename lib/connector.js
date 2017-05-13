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
class NoExistingConnections extends Error {
    constructor() {
        super('');
        this.message = '';
        this.name = 'NoExistingConnections';
        Error.captureStackTrace(this, NoExistingConnections);
    }
}
exports.NoExistingConnections = NoExistingConnections;
class Connector {
    constructor(core) {
        this.core = core;
        console.log(getConnections());
        console.log(getPinnedConnection());
    }
    connect(conn) {
        // only one connection is allowed at a time, kill the old one
        this.disconnect();
        if (conn) {
            return connect(conn);
        }
        return getConnection()
            .catch(NoExistingConnections, err => {
            console.log(err);
            return autoSearch()
                .then(mkConnection)
                .then(connect);
        })
            .then(conn => {
            console.log('got connection from the internal state');
            console.log(conn);
            this.current = conn;
            return conn;
        });
    }
    disconnect() {
        if (this.current) {
            this.current.stream.end();
            this.current = undefined;
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
function getPinnedConnection() {
    const state = atom.config.get('agda-mode.internalState');
    if (state.pinned) {
        return _.find(state.connections, {
            guid: state.pinned
        });
    }
}
exports.getPinnedConnection = getPinnedConnection;
function getConnection() {
    const pinned = getPinnedConnection();
    const connections = getConnections();
    if (pinned) {
        return Promise.resolve(pinned);
    }
    else {
        if (connections.length > 0) {
            return Promise.resolve(connections[0]);
        }
        else {
            return Promise.reject(new NoExistingConnections);
        }
    }
}
exports.getConnection = getConnection;
function mkConnection(uri) {
    return {
        guid: util_1.guid(),
        uri: parser_1.parseFilepath(uri)
    };
}
exports.mkConnection = mkConnection;
function autoSearch() {
    if (process.platform === 'win32') {
        return Promise.reject(new AutoConnectFailure('win32'));
    }
    return new Promise((resolve, reject) => {
        child_process_1.exec(`which agda`, (error, stdout, stderr) => {
            if (error) {
                reject(new AutoConnectFailure(error.toString()));
            }
            else {
                resolve(stdout);
            }
        });
    });
}
exports.autoSearch = autoSearch;
// automatically searches for available Agda connections
// export function autoConnect(): Promise<Connection> {
//     return autoSearch.then(mkConnection)
// }
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