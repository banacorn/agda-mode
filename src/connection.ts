import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import { inspect } from 'util';
import { spawn, exec, ChildProcess } from 'child_process';
import { Duplex } from 'stream';
var duplex = require('duplexer');

import Rectifier from './parser/stream/rectifier';
import { View, Socket, ProcessInfo, ConnectionInfo, GUID } from './type';
import * as Err from './error';
import { guid } from './util';
import { Core } from './core';
import { parseFilepath, parseResponses } from './parser';
import * as Action from "./view/actions";
import * as InternalState from "./internal-state";

export default class ConnectionManager {
    private selected?: ConnectionInfo;
    private socket?: Socket;

    constructor(private core: Core) {
        this.recoverAgda = this.recoverAgda.bind(this);
        this.handleError = this.handleError.bind(this);
    }

    // select a target ConnectionInfo to be connected
    select(connInfo: ConnectionInfo) {
        this.selected = connInfo;
    }

    unselect(connInfo: ConnectionInfo) {
        if (this.selected && this.selected.guid === connInfo.guid) {
            this.selected = undefined;
        }
        if (this.socket && this.socket.guid === connInfo.guid) {
            this.disconnect();
        }
    }

    // connect with the selected ConnectionInfo
    connect(): Promise<Socket> {
        if (!this.selected) {
            return getExistingConnectionInfo()
                .then(selected => {
                    this.selected = selected;
                    return connectAgda(this.selected, this.core.editor.getPath())
                        .then(this.wire);
                    // if (selected.languageServer) {
                    //     return connectLanguageServer(this.selected, this.core.getPath())
                    //         .then(this.wire);
                    // } else {
                    //     return connectAgda(this.selected, this.core.getPath())
                    //         .then(this.wire);
                    // }
                })
                .catch(Err.Conn.NoCandidates, error => {
                    return autoSearch('agda')
                        .then(validateAgda)
                        .catch(Err.Conn.Invalid, this.recoverAgda)
                        .then(mkConnectionInfo)
                        .then(connInfo => {
                            // let it be selected
                            this.selected = connInfo;
                            // update the view
                            this.core.view.store.dispatch(Action.CONNECTION.addConnection(connInfo));
                            return connectAgda(connInfo, this.core.editor.getPath())
                                .then(this.wire);
                        });
                })
        }

        // only recoonect when the selected is different from the connected
        if (this.socket && this.socket.guid === this.selected.guid) {
            // there's no need of re-establish a new connection
            return Promise.resolve(this.socket);
        } else {
            // cut the old connection
            this.disconnect();
            // and establish a new one
            return connectAgda(this.selected, this.core.editor.getPath())
                .then(this.wire);
        }
    }

    // disconnect the current connection
    disconnect() {
        if (this.socket) {
            // the view
            this.core.view.store.dispatch(Action.CONNECTION.disconnect(this.socket.guid));
            // the streams
            this.socket.stream.end();
            // the property
            this.socket = undefined;
        }
    }

    getConnection(): Promise<Socket> {
        if (this.socket)
            return Promise.resolve(this.socket);
        else
            return Promise.reject(new Err.Conn.NotEstablished);
    }

    //
    private wire = (socket: Socket): Promise<Socket> => {
        // the view
        this.core.view.store.dispatch(Action.CONNECTION.connect(this.selected.guid));
        // the properties
        this.socket = socket;
        // modify the method write so that we can intercept and redirect data to the core;
        const write = socket.stream.write;
        socket.stream.write = data => {
            this.core.view.store.dispatch(Action.PROTOCOL.logRequest({
                raw: data.toString(),
                parsed: null
            }));
            this.core.view.store.dispatch(Action.PROTOCOL.pending(true));
            return write(data);
        };
        // the streams
        socket.stream
            .pipe(new Rectifier)
            .on('data', (data) => {
                const promise = this.socket.queue.pop();
                const lines = data.toString().trim().split('\n');
                parseResponses(data.toString())
                    .then(responses => {
                        this.core.view.store.dispatch(Action.PROTOCOL.logResponses(responses.map((response, i) => ({
                            raw: lines[i],
                            parsed: response
                        }))));
                        this.core.view.store.dispatch(Action.PROTOCOL.pending(false));
                        promise.resolve(responses);
                    })
                    .catch(Err.ParseError, error => {
                        this.core.view.set('Parse Error', [error.message, error.raw], View.Style.Error);
                        promise.resolve([]);
                    })
                    .catch(error => {
                        this.handleError(error);
                        promise.resolve([]);
                    })
            });
        return Promise.resolve(socket);
    }


    recoverAgda(): Promise<ProcessInfo> {
        return this.core.view.queryConnection()
            .then(validateAgda)
            .catch(Err.Conn.Invalid, this.recoverAgda);
    }

    handleError(error: Error) {
        this.core.view.set('Error', [error.message], View.Style.Error);
        if (this.selected) {
            this.core.view.store.dispatch(Action.CONNECTION.err(this.selected.guid));
        } else {
            this.core.view.store.dispatch(Action.CONNECTION.showNewConnectionView(true));
        }
    }
}

export function getExistingConnectionInfo(): Promise<ConnectionInfo> {
    const state = InternalState.get();

    const selected = _.find(state.connections, {
        guid: state.selected
    });

    if (selected) {
        return Promise.resolve(selected);
    } else {
        if (state.connections.length > 0) {
            return Promise.resolve(state.connections[0]);
        } else {
            return Promise.reject(new Err.Conn.NoCandidates);
        }
    }
}

export function mkConnectionInfo(agda: ProcessInfo): ConnectionInfo {
    return {
        guid: guid(),
        agda: agda
    }
}

export function autoSearch(location: string): Promise<string> {
    if (process.platform === 'win32') {
        return Promise.reject(new Err.Conn.AutoSearchError('Unable to locate Agda on Windows systems', location));
    }

    return new Promise<string>((resolve, reject) => {
        exec(`which ${location}`, (error, stdout, stderr) => {
            if (error) {
                reject(new Err.Conn.AutoSearchError(`Cannot find "${location}".\nLocating "${location}" in the user's path with 'which' but failed with the following error message: ${error.toString()}`, location));
            } else {
                resolve(parseFilepath(stdout));
            }
        });
    });
}


// to make sure that we are connecting with Agda
export function validateProcess(location: string, validator: (msg: string, resolve, reject) => void): Promise<ProcessInfo> {
    location = parseFilepath(location);
    return new Promise<ProcessInfo>((resolve, reject) => {
        var stillHanging = true;

        if (location === '') {
            reject(new Err.Conn.Invalid(`The location must not be empty`, location));
        }

        // ask for the version and see if it's really Agda
        exec(`${location} --version`, (error, stdout, stderr) => {
            stillHanging = false;

            if (error) {
                // command not found
                if (error.message.toString().match(/command not found/)) {
                    reject(new Err.Conn.Invalid(`The provided program was not found`, location));
                // command found however the arguments are invalid
                } else {
                    reject(new Err.Conn.Invalid(`The provided program doesn't seem like Agda:\n\n${error.message}`, location));
                }
            }
            if (stderr) {
                const message = `Spawned process returned with the following result (from stderr):\n\n\"${stdout.toString()}\"`;
                reject(new Err.Conn.Invalid(message, location));
            }

            validator(stdout.toString(), resolve, reject);
        });

        // wait for the process for about 1 sec, if it still does not
        // respond then reject
        setTimeout(() => {
            if (stillHanging) {
                const message = `The provided program hangs`;
                return Promise.reject(new Err.Conn.Invalid(message, location));
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
            reject(new Err.Conn.Invalid(`The provided program doesn't seem like Agda`, location));
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
            reject(new Err.Conn.Invalid(`The provided program doesn't seem like Agda Language Server`, location));
        }
    });
}

export function connectAgda(connInfo: ConnectionInfo, filepath: string): Promise<Socket> {
    return new Promise<Socket>((resolve, reject) => {
        const agdaProcess = spawn(connInfo.agda.location, ['--interaction'], { shell: true });
        agdaProcess.on('error', (error) => {
            reject(new Err.Conn.Connection(
                error.message,
                connInfo.agda.location,
                connInfo.guid,
            ));
        });
        agdaProcess.on('close', (signal) => {
            const message = signal === 127 ?
                `exit with signal ${signal}, Agda is not found`:
                `exit with signal ${signal}`;
            reject(new Err.Conn.Connection(
                message,
                connInfo.agda.location,
                connInfo.guid,
            ));
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
                reject(new Err.Conn.Connection(
                    `The provided program doesn't seem like Agda:\n\n ${data.toString()}`,
                    connInfo.agda.location,
                    connInfo.guid,
                ));
            }
        });
    });
}
