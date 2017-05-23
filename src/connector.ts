import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import { inspect } from 'util';
import { spawn, exec, ChildProcess } from 'child_process';
import { Duplex } from 'stream';
var duplex = require('duplexer');

declare var atom: any;

import Rectifier from './parser/stream/rectifier';
import { View, Connection, ConnectionInfo, GUID } from './type';
import { guid } from './util';
import Core from './core';
import { parseFilepath, parseAgdaResponse } from './parser';
import * as Action from "./view/actions";
import * as Store from "./persist";
import { handleAgdaResponse } from './handler';


export class AutoConnectFailure extends Error {
    constructor(message: string) {
        super(message);
        this.message = message;
        this.name = 'AutoConnectFailure';
        Error.captureStackTrace(this, AutoConnectFailure);
    }
}

export class ConnectionError extends Error {
    constructor(message: string, public uri?: string) {
        super(message);
        this.message = message;
        this.uri = uri;
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

export class ConnectionNotEstablished extends Error {
    constructor() {
        super('');
        this.message = 'Connection not established yet';
        this.name = 'ConnectionNotEstablished';
        Error.captureStackTrace(this, ConnectionNotEstablished);
    }
}

export default class Connector {
    private selected?: ConnectionInfo;
    private connection?: Connection;

    constructor(private core: Core) {

        // this.updateCurrentConnection = this.updateCurrentConnection.bind(this);
    }

    // select a target ConnectionInfo to be connected
    select(connInfo: ConnectionInfo) {

    }

    // connect with the selected ConnectionInfo
    connect(): Promise<Connection> {
        if (this.selected) {
            return connect(this.selected, this.core.getPath())
                .then(this.wireStream);
        } else {
            return getExistingConnectionInfo()
                .then(selected => {
                    console.log(selected);
                    this.selected = selected
                    return connect(this.selected, this.core.getPath())
                        .then(this.wireStream);
                })
                .catch(NoExistingConnections, () => {
                    return Promise.reject(new NoExistingConnections);
                })
        }

    }

    // disconnect the current connection
    disconnect() {

    }

    getConnection(): Promise<Connection> {
        return null;
    }

    //
    private wireStream = (conn: Connection): Promise<Connection> => {
        this.core.view.store.dispatch(Action.CONNECTION.connect(this.selected.guid));
        conn.stream
            .pipe(new Rectifier)
            .on('data', (data) => {
                try {
                    const response = parseAgdaResponse(data.toString());
                    handleAgdaResponse(this.core, response);
                } catch (error) {
                    console.log(error)
                    // show some message
                    this.core.view.set('Agda Parse Error',
                        [`Message from agda:`].concat(data.toString()),
                        View.Style.Error);
                }
            })
        return Promise.resolve(conn);
    }

    // private updateCurrentConnection = (conn: Connection): Promise<Connection> => {
    //     this.disconnect();
    //     this.current = conn;
    //     this.core.view.store.dispatch(Action.CONNECTION.addConnection(conn));
    //     this.core.view.store.dispatch(Action.CONNECTION.connect(conn.guid));
    //     return Promise.resolve(conn);
    // }
    //
    // setConnection(connInfo: ConnectionInfo) {
    //     if (this.current) {
    //         this.core.view.store.dispatch(Action.CONNECTION.disconnect(this.current.guid));
    //     }
    //
    //     this.selected = connInfo;
    //
    // }
    //
    // connect(connInfo?: ConnectionInfo): Promise<Connection> {
    //     // console.log('connecting', connInfo || this.current)
    //     if (connInfo) {
    //         if (this.current && this.current.guid === connInfo.guid) {
    //             return Promise.resolve(this.current)
    //                 .then(this.wireStream);
    //         } else {
    //             return connect(connInfo, this.core.getPath())
    //                 .then(this.updateCurrentConnection)
    //                 .then(this.wireStream);
    //         }
    //     } else {
    //         if (this.current) {
    //             return Promise.resolve(this.current);
    //         } else {
    //             return getExistingConnectionInfo()
    //                 .catch(NoExistingConnections, err => {
    //                     return autoSearch()
    //                         .then(validate)
    //                 })
    //                 .then(connInfo => {
    //                     return connect(connInfo, this.core.getPath())
    //                         .then(this.updateCurrentConnection);
    //                 })
    //                 .then(this.wireStream)
    //         }
    //     }
    // }
    //
    // disconnect(connInfo?: ConnectionInfo) {
    //     if (connInfo) {
    //         // connection specified and happens to be the current connection
    //         if (this.current && this.current.guid === connInfo.guid) {
    //             // console.log('X', this.current)
    //             this.core.view.store.dispatch(Action.CONNECTION.disconnect(this.current.guid));
    //             this.current.stream.end();
    //             this.current = undefined;
    //         }
    //     } else {
    //         // no connection specified, end the current connection
    //         if (this.current) {
    //             // console.log('X', this.current)
    //             this.core.view.store.dispatch(Action.CONNECTION.disconnect(this.current.guid));
    //             this.current.stream.end();
    //             this.current = undefined;
    //         }
    //     }
    // }
    //
    // getConnection(): Promise<Connection> {
    //     if (this.current)
    //         return Promise.resolve(this.current)
    //     else
    //         return Promise.reject(new ConnectionNotEstablished)
    // }
}

export function getExistingConnectionInfo(): Promise<ConnectionInfo> {
    const state = Store.get();

    const selected = _.find(state.connections, {
        guid: state.selected
    });

    if (selected) {
        return Promise.resolve(selected);
    } else {
        if (state.connections.length > 0) {
            return Promise.resolve(state.connections[0]);
        } else {
            return Promise.reject(new NoExistingConnections)
        }
    }
}

export function mkConnectionInfo(uri: string): ConnectionInfo {
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
                resolve(parseFilepath(stdout));
            }
        });
    });
}


export function validate(uri: string): Promise<ConnectionInfo> {
    uri = parseFilepath(uri);
    return new Promise<ConnectionInfo>((resolve, reject) => {
        exec(`${uri} --version`, (error, stdout, stderr) => {

            if (uri === '') {
                return reject(new ConnectionError(`The path must not be empty`, uri));
            }

            if (error) {
                // command not found
                if (error.message.toString().match(/command not found/)) {
                    return reject(new ConnectionError(`Unable to connect the given executable:\n${error.message}`, uri));
                // command found however the arguments are invalid
                } else {
                    return reject(new ConnectionError(`This doesn't seem like Agda:\n${error.message}`, uri));
                }
            }
            if (stderr) {
                const message = `Spawned process returned with the following result (from stderr):\n\"${stdout.toString()}\"`;
                return reject(new ConnectionError(message, uri));
            }

            const result = stdout.toString().match(/^Agda version (.*)(?:\r\n?|\n)$/);
            if (result) {
                // normalize version number to valid semver
                const rawVerNum = result[1];
                const semVerNum = _.take((result[1] + '.0.0.0').replace('-', '.').split('.'), 3).join('.');
                let connInfo = mkConnectionInfo(uri);
                connInfo.version = {
                    raw: rawVerNum,
                    sem: semVerNum
                };
                resolve(connInfo);
            } else {
                const message = `Doesn't seem like Agda to me: \n\"${stdout.toString()}\"`;
                reject(new ConnectionError(message, uri));
            }
        });
    });
}

export function connect(connInfo: ConnectionInfo, filepath: string): Promise<Connection> {
    return new Promise<Connection>((resolve, reject) => {
        const agdaProcess = spawn(connInfo.uri, ['--interaction'], { shell: true });
        agdaProcess.on('error', (error) => {
            reject(new ConnectionError(error.message, connInfo.uri));
        });
        agdaProcess.on('close', (signal) => {
            reject(new ConnectionError(`exit with signal ${signal}`, connInfo.uri));
        });
        agdaProcess.stdout.once('data', (data) => {
            const result = data.toString().match(/^Agda2\>/);
            if (result) {
                resolve({
                    ...connInfo,
                    stream: duplex(agdaProcess.stdin, agdaProcess.stdout),
                    filepath
                });
            } else {
                reject(new ConnectionError(`doesn't act like agda: ${data.toString()}`, connInfo.uri));
            }
        });
    });
}
