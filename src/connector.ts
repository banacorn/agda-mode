import * as Promise from 'bluebird';
import * as _ from 'lodash';
import { spawn, exec, ChildProcess } from 'child_process';
import { Duplex } from 'stream';
var duplex = require('duplexer');

declare var atom: any;

import { Connection, ConnectionInfo } from './type';
import { guid } from './util';
import Core from './core';
import { parseFilepath } from './parser';
import * as Action from "./view/actions";


export class AutoConnectFailure extends Error {
    constructor(message: string) {
        super(message);
        this.message = message;
        this.name = 'AutoConnectFailure';
        Error.captureStackTrace(this, AutoConnectFailure);
    }
}

export class ConnectionError extends Error {
    constructor(message: string, public connInfo?: ConnectionInfo) {
        super(message);
        this.message = message;
        this.connInfo = connInfo;
        this.name = 'ConnectionError';
        Error.captureStackTrace(this, ConnectionError);
    }
}

export class NoExistingConnections extends Error {
    constructor() {
        super('');
        this.message = '';
        this.name = 'NoExistingConnections';
        Error.captureStackTrace(this, NoExistingConnections);
    }
}

export default class Connector {
    private current?: Connection;

    constructor(private core: Core) {
    }

    connect(connInfo?: ConnectionInfo): Promise<Connection> {
        // only one connection is allowed at a time, kill the old one
        this.disconnect();

        if (connInfo) {
            return connect(connInfo)
                .then(conn => {
                    this.current = conn;
                    return conn;
                })
        } else {
            return getConnection()
                .then(connect)
                .catch(NoExistingConnections, err => {
                    return autoSearch()
                        .then(mkConnection)
                        .then(connect)
                })
                .then(conn => {
                    this.current = conn;
                    return conn;
                })
        }
    }

    disconnect() {
        if (this.current) {
            this.current.stream.end();
            this.current = undefined;
        }
    }
}

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

export function getConnections(): ConnectionInfo[] {
    const state = atom.config.get('agda-mode.internalState');
    return JSON.parse(state).connections;
}

export function getPinnedConnection(): ConnectionInfo | undefined {
    const state = atom.config.get('agda-mode.internalState');
    if (state.pinned) {
        return _.find(state.connections, {
            guid: state.pinned
        }) as ConnectionInfo;
    }
}

export function getConnection(): Promise<ConnectionInfo> {
    const pinned = getPinnedConnection();
    const connections = getConnections();
    if (pinned) {
        return Promise.resolve(pinned);
    } else {
        if (connections.length > 0) {
            return Promise.resolve(connections[0]);
        } else {
            return Promise.reject(new NoExistingConnections)
        }
    }
}

export function mkConnection(uri: string): ConnectionInfo {
    return {
        guid: guid(),
        uri: parseFilepath(uri)
    }
}

export function autoSearch(): Promise<string> {
    if (process.platform === 'win32') {
        return Promise.reject(new AutoConnectFailure('win32'));
    }

    return new Promise<string>((resolve, reject) => {
        exec(`which agda`, (error, stdout, stderr) => {
            if (error) {
                reject(new AutoConnectFailure(error.toString()));
            } else {
                resolve(stdout);
            }
        });
    });
}


export function validate(connInfo: ConnectionInfo): Promise<ConnectionInfo> {
    return new Promise<ConnectionInfo>((resolve, reject) => {
        exec(`${connInfo.uri} --version`, (error, stdout, stderr) => {

            if (connInfo.uri === '') {
                return reject(new ConnectionError(`The path must not be empty`, connInfo));
            }

            if (error) {
                // command not found
                if (error.message.toString().match(/command not found/)) {
                    return reject(new ConnectionError(`Unable to connect the given executable:\n${error.message}`, connInfo));
                // command found however the arguments are invalid
                } else {
                    return reject(new ConnectionError(`This doesn't seem like Agda:\n${error.message}`, connInfo));
                }
            }

            if (stderr) {
                const message = `Spawned process returned with the following result (from stderr):\n\"${stdout.toString()}\"`;
                return reject(new ConnectionError(message, connInfo));
            }

            const result = stdout.toString().match(/^Agda version (.*)(?:\r\n?|\n)$/);
            if (result) {
                // normalize version number to valid semver
                const rawVerNum = result[1];
                const semVerNum = _.take((result[1] + '.0.0.0').replace('-', '.').split('.'), 3).join('.');
                connInfo.version = {
                    raw: rawVerNum,
                    sem: semVerNum
                };
                resolve(connInfo);
            } else {
                const message = `Doesn't seem like Agda to me: \n\"${stdout.toString()}\"`;
                reject(new ConnectionError(message, connInfo));
            }
        });
    });
}

export function connect(connInfo: ConnectionInfo): Promise<Connection> {
    return new Promise<Connection>((resolve, reject) => {
        const agdaProcess = spawn(connInfo.uri, ['--interaction']);
        agdaProcess.on('error', (error) => {
            reject(new ConnectionError(error.message, connInfo));
        });
        agdaProcess.on('close', (signal) => {
            reject(new ConnectionError(`exit with signal ${signal}`, connInfo));
        });
        resolve({
            ...connInfo,
            stream: duplex(agdaProcess.stdin, agdaProcess.stdout)
        });
    });
}

export function close(conn: Connection) {
    conn.stream.end();
}
