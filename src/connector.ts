import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import { inspect } from 'util';
import { spawn, exec, ChildProcess } from 'child_process';
import { Duplex } from 'stream';
var duplex = require('duplexer');

declare var atom: any;

import Rectifier from './parser/stream/rectifier';
import { View, Connection, ProcessInfo, ConnectionInfo, GUID } from './type';
import { ParseError } from './error';
import { guid } from './util';
import Core from './core';
import { parseFilepath, parseResponses } from './parser';
import * as Action from "./view/actions";
import * as Store from "./persist";

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
    constructor(message: string, public location: string, public guid?: GUID) {
        super(message);
        this.message = message;
        this.location = location;
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
                    if (selected.languageServer) {
                        return connectLanguageServer(this.selected, this.core.getPath())
                            .then(this.wire);
                    } else {
                        return connectAgda(this.selected, this.core.getPath())
                            .then(this.wire);
                    }
                })
                .catch(NoExistingConnections, () => {
                    return autoSearch('agda')
                        .then(validateAgda)
                        .then(mkConnectionInfo)
                        .then(connInfo => {
                            // let it be selected
                            this.selected = connInfo;
                            // update the view
                            this.core.view.store.dispatch(Action.CONNECTION.addConnection(connInfo));
                            return connectAgda(connInfo, this.core.getPath())
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
            return connectAgda(this.selected, this.core.getPath())
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
            this.core.view.store.dispatch(Action.PROTOCOL.logRequest({
                raw: data.toString(),
                parsed: null
            }));
            return write(data);
        };
        // the streams
        conn.stream
            .pipe(new Rectifier)
            .on('data', (data) => {
                const promise = this.connection.queue.pop();
                const lines = data.toString().trim().split('\n');
                parseResponses(data.toString())
                    .then(responses => {
                        this.core.view.store.dispatch(Action.PROTOCOL.logResponses(responses.map((response, i) => ({
                            raw: lines[i],
                            parsed: response
                        }))));
                        promise.resolve(responses);
                    })
                    .catch(ParseError, error => {
                        this.core.view.set('Parse Error', [error.message, error.raw], View.Style.Error);
                        promise.resolve([]);
                    })
                    .catch(error => {
                        this.core.view.set('Error', [error.message], View.Style.Error);
                        promise.resolve([]);
                    })

                // try {
                //     this.core.view.store.dispatch(Action.PROTOCOL.addResponse(data.toString()));
                //     const response = parseResponse(data.toString());
                //     handleResponse(this.core, response);
                // } catch (error) {
                //     // this.core.view.store.dispatch(Action.CONNECTION.err(this.selected.guid));
                //     console.log(error)
                //     // show some message
                //     this.core.view.set('Agda Parse Error',
                //         [`Message from agda:`].concat(data.toString()),
                //         View.Style.Error);
                // }
            });
        return Promise.resolve(conn);
    }

    queryConnection(): Promise<Connection> {
        return this.core.view.queryConnection()
            .then(validateAgda)
            .then(mkConnectionInfo)
            .then(connInfo => {
                // let it be selected
                this.selected = connInfo;
                // update the view
                this.core.view.store.dispatch(Action.CONNECTION.addConnection(connInfo));
                return connectAgda(connInfo, this.core.getPath())
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

export function mkConnectionInfo(agda: ProcessInfo): ConnectionInfo {
    return {
        guid: guid(),
        agda: agda
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



export function validateProcess(location: string, validator: (msg: string, resolve, reject) => void): Promise<ProcessInfo> {
    location = parseFilepath(location);
    return new Promise<ProcessInfo>((resolve, reject) => {
        var stillHanging = true;
        exec(`${location} --version`, (error, stdout, stderr) => {
            stillHanging = false;

            if (location === '') {
                return reject(new ConnectionError(`The location must not be empty`, location));
            }
            if (error) {
                // command not found
                if (error.message.toString().match(/command not found/)) {
                    return reject(new ConnectionError(`Unable to connect the given executable:\n${error.message}`, location));
                // command found however the arguments are invalid
                } else {
                    return reject(new ConnectionError(`This doesn't seem like Agda:\n${error.message}`, location));
                }
            }
            if (stderr) {
                const message = `Spawned process returned with the following result (from stderr):\n\"${stdout.toString()}\"`;
                return reject(new ConnectionError(message, location));
            }

            validator(stdout.toString(), resolve, reject);
        });

        // wait for the process for about 1 sec, if it still does not
        // respond then reject
        setTimeout(() => {
            if (stillHanging) {
                const message = `The provided program hangs`;
                reject(new ConnectionError(message, location));
            }
        }, 1000)
    });
}

export function validateAgda(location: string): Promise<ProcessInfo> {
    return validateProcess(location, (message, resolve, reject) => {
        const result = message.match(/^Agda version (.*)(?:\r\n?|\n)$/);
        if (result) {
            // normalize version number to valid semver
            const raw = result[1];
            const tokens = result[1].replace('-', '.').split('.');
            const sem = tokens.length > 3
                ? _.take(tokens, 3).join('.')
                : tokens.join('.');
            const version = { raw, sem };
            resolve({
                location,
                version
            });
        } else {
            reject(new ConnectionError(`Doesn't seem like Agda to me: \n\"${message}\"`, location));
        }
    });
}

export function validateLanguageServer(location: string): Promise<ProcessInfo> {
    return validateProcess(location, (message, resolve, reject) => {
        const result = message.match(/^Agda Language Server (.*)(?:\r\n?|\n)$/);
        if (result) {
            resolve({
                location: location
            })
        } else {
            reject(new ConnectionError(`Doesn't seem like Agda to me: \n\"${message}\"`, location));
        }
    });
}

export function connectAgda(connInfo: ConnectionInfo, filepath: string): Promise<Connection> {
    return new Promise<Connection>((resolve, reject) => {
        const agdaProcess = spawn(connInfo.agda.location, ['--interaction'], { shell: true });
        agdaProcess.on('error', (error) => {
            reject(new ConnectionError(error.message, connInfo.agda.location, connInfo.guid));
        });
        agdaProcess.on('close', (signal) => {
            reject(new ConnectionError(`exit with signal ${signal}`, connInfo.agda.location, connInfo.guid));
        });
        // validate the spawned process
        agdaProcess.stdout.once('data', (data) => {
            const result = data.toString().match(/^Agda2\>/);
            if (result) {
                resolve({
                    ...connInfo,
                    stream: duplex(agdaProcess.stdin, agdaProcess.stdout),
                    queue: [],
                    filepath
                });
            } else {
                reject(new ConnectionError(`doesn't act like agda: ${data.toString()}`, connInfo.agda.location, connInfo.guid));
            }
        });
    });
}

export function connectLanguageServer(connInfo: ConnectionInfo, filepath: string): Promise<Connection> {
    return new Promise<Connection>((resolve, reject) => {
        const languageServerProcess = spawn(connInfo.languageServer.location, [], { shell: true });
        languageServerProcess.on('error', (error) => {
            reject(new ConnectionError(error.message, connInfo.agda.location, connInfo.guid));
        });
        languageServerProcess.on('close', (signal) => {
            reject(new ConnectionError(`exit with signal ${signal}`, connInfo.agda.location, connInfo.guid));
        });
        languageServerProcess.stdout.once('data', (data) => {
            const result = data.toString().match(/^Agda2\>/);
            if (result) {
                resolve({
                    ...connInfo,
                    stream: duplex(languageServerProcess.stdin, languageServerProcess.stdout),
                    queue: [],
                    filepath
                });
            } else {
                reject(new ConnectionError(`doesn't act like agda: ${data.toString()}`, connInfo.agda.location, connInfo.guid));
            }
        });
    });
}
