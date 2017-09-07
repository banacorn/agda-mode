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

// Custom Errors
export class NoConnectionGiven extends Error {
    constructor() {
        super('');
        this.message = '';
        this.name = 'NoConnectionGiven';
        Error.captureStackTrace(this, NoConnectionGiven);
    }
}

export class AutoSearchFailure extends Error {
    constructor(message: string) {
        super(message);
        this.message = message;
        this.name = 'AutoSearchFailure';
        Error.captureStackTrace(this, AutoSearchFailure);
    }
}

export class ConnectionError extends Error {
    constructor(message: string, public uri: string, public guid?: GUID) {
        super(message);
        this.message = message;
        this.uri = uri;
        this.guid = guid;
        this.name = 'Connection Error';
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
    }

    // select a target ConnectionInfo to be connected
    select(connInfo: ConnectionInfo) {
        this.selected = connInfo;
    }

    unselect(connInfo: ConnectionInfo) {
        if (this.selected && this.selected.guid === connInfo.guid) {
            this.selected = undefined;
        }
        if (this.connection && this.connection.guid === connInfo.guid) {
            this.disconnect();
        }
    }

    // connect with the selected ConnectionInfo
    connect(): Promise<Connection> {
        if (!this.selected) {
            return getExistingConnectionInfo()
                .then(selected => {
                    this.selected = selected;
                    return connect(this.selected, this.core.getPath())
                        .then(this.wire);
                })
                .catch(NoExistingConnections, () => {
                    return autoSearch('agda')
                        .then(validateAgda)
                        .then(connInfo => {
                            // let it be selected
                            this.selected = connInfo;
                            // update the view
                            this.core.view.store.dispatch(Action.CONNECTION.addConnection(connInfo));
                            return connect(connInfo, this.core.getPath())
                                .then(this.wire);
                        })
                })
                .catch(AutoSearchFailure, () => {
                    return this.queryConnection()
                })
        }

        // only recoonect when the selected is different from the connected
        if (this.connection && this.connection.guid === this.selected.guid) {
            // there's no need of re-establish a new connection
            return Promise.resolve(this.connection);
        } else {
            // cut the old connection
            this.disconnect();
            // and establish a new one
            return connect(this.selected, this.core.getPath())
                .then(this.wire);
        }
    }

    // disconnect the current connection
    disconnect() {
        if (this.connection) {
            // the view
            this.core.view.store.dispatch(Action.CONNECTION.disconnect(this.connection.guid));
            // the streams
            this.connection.stream.end();
            // the property
            this.connection = undefined;
        }
    }

    getConnection(): Promise<Connection> {
        if (this.connection)
            return Promise.resolve(this.connection);
        else
            return Promise.reject(new ConnectionNotEstablished);
    }

    //
    private wire = (conn: Connection): Promise<Connection> => {
        // the view
        this.core.view.store.dispatch(Action.CONNECTION.connect(this.selected.guid));
        // the properties
        this.connection = conn;
        // modify the method write so that we can intercept and redirect data to the core;
        const write = conn.stream.write;
        conn.stream.write = data => {
            this.core.view.store.dispatch(Action.PROTOCOL.addRequest(data.toString()));
            return write(data);
        };
        // the streams
        conn.stream
            .pipe(new Rectifier)
            .on('data', (data) => {
                try {
                    this.core.view.store.dispatch(Action.PROTOCOL.addResponse(data.toString()));
                    const response = parseAgdaResponse(data.toString());
                    handleAgdaResponse(this.core, response);
                } catch (error) {
                    // this.core.view.store.dispatch(Action.CONNECTION.err(this.selected.guid));
                    console.log(error)
                    // show some message
                    this.core.view.set('Agda Parse Error',
                        [`Message from agda:`].concat(data.toString()),
                        View.Style.Error);
                }
            });
        return Promise.resolve(conn);
    }

    queryConnection(): Promise<Connection> {
        return this.core.view.queryConnection()
            .then(validateAgda)
            .then(connInfo => {
                // let it be selected
                this.selected = connInfo;
                // update the view
                this.core.view.store.dispatch(Action.CONNECTION.addConnection(connInfo));
                return connect(connInfo, this.core.getPath())
                    .then(this.wire);
            })
            .catch(NoConnectionGiven, () => {
                // this.queryConnection();
            })
    }
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
        uri: parseFilepath(uri),
        protocol: 'Vanilla' // as default
    }
}

export function autoSearch(filepath: string): Promise<string> {
    if (process.platform === 'win32') {
        return Promise.reject(new AutoSearchFailure('win32'));
    }

    return new Promise<string>((resolve, reject) => {
        exec(`which ${filepath}`, (error, stdout, stderr) => {
            if (error) {
                reject(new AutoSearchFailure(error.toString()));
            } else {
                resolve(parseFilepath(stdout));
            }
        });
    });
}


export function validateAgda(uri: string): Promise<ConnectionInfo> {
    uri = parseFilepath(uri);
    return new Promise<ConnectionInfo>((resolve, reject) => {
        var stillHanging = true;
        exec(`${uri} --version`, (error, stdout, stderr) => {
            stillHanging = false;

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
                const tokens = result[1].replace('-', '.').split('.');
                const semVerNum = tokens.length > 3
                    ? _.take(tokens, 3).join('.') + '-' + _.drop(tokens, 3).join('-')
                    : tokens.join('.');
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

        // wait for the process for about 1 sec, if it still does not
        // respond then reject
        setTimeout(() => {
            if (stillHanging) {
                const message = `The provided program hangs`;
                reject(new ConnectionError(message, uri));
            }
        }, 1000)
    });
}

export function connect(connInfo: ConnectionInfo, filepath: string): Promise<Connection> {
    return new Promise<Connection>((resolve, reject) => {
        const agdaProcess = spawn(connInfo.uri, ['--interaction'], { shell: true });
        agdaProcess.on('error', (error) => {
            reject(new ConnectionError(error.message, connInfo.uri, connInfo.guid));
        });
        agdaProcess.on('close', (signal) => {
            reject(new ConnectionError(`exit with signal ${signal}`, connInfo.uri, connInfo.guid));
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
                reject(new ConnectionError(`doesn't act like agda: ${data.toString()}`, connInfo.uri, connInfo.guid));
            }
        });
    });
}
