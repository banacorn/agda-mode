"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
// type TextBuffer = any;
// type Point = any;
// type Range = any;
// var { Range } = require('atom');
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
// export class Connection {
//     readonly uri: string;
//     public version: {
//         raw: string;
//         sem: string;
//     }
//
//     // private connected: boolean;
//     // private stream: Duplex;
//
//     constructor(uri: string) {
//         this.uri = uri;
//     }
// }
class Connector {
    // private markers: any[];
    // public connections: Connection[];
    constructor(core) {
        // initialize previous connections
        // this.connections = [];
        this.core = core;
        // console.log(this.getConnections());
        this.connect()
            .then((conn) => {
            // console.log(conn)
            this.addConnection(conn);
            conn.stream.on('data', (data) => {
                console.log(data.toString());
            });
        }).catch(AutoConnectFailure, (err) => {
            console.error(err);
            // this.core.view.store.dispatch(Action.CONNECTION.showSetupView(true));
        }).catch(ConnectionError, (err) => {
            console.error(err);
        }).catch((err) => {
            console.error(err);
        });
    }
    connect() {
        const previousConnections = this.getConnections();
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
    getConnections() {
        const raw = atom.config.get('agda-mode.internalState');
        return JSON.parse(raw).connections;
    }
    addConnection({ guid, uri, version }) {
        const state = JSON.parse(atom.config.get('agda-mode.internalState'));
        state.connections.push({ guid, uri, version });
        atom.config.set('agda-mode.internalState', JSON.stringify(state));
    }
}
exports.default = Connector;
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
                resolve({
                    guid: util_1.guid(),
                    uri: parser_1.parseFilepath(stdout)
                });
            }
        });
    });
}
function validate(conn) {
    return new Promise((resolve, reject) => {
        child_process_1.exec(`${conn.uri} --version`, (error, stdout, stderr) => {
            if (conn.uri === '') {
                return reject(new ConnectionError(`The path must not be empty`, conn));
            }
            if (error) {
                return reject(new ConnectionError(`Unable to execute the given command`, conn));
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
                const message = `Spawned process returned with the following result (from stdout):\n\"${stdout.toString()}\"`;
                reject(new ConnectionError(message, conn));
            }
        });
    });
}
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
//# sourceMappingURL=connector.js.map